# 🚀 Déployer l'Edge Function "reset-imports"

Guide simple pour déployer la fonction de reset automatique des imports mensuels.

---

## 📋 Étape 1 : Créer l'Edge Function dans Supabase

### Via le Dashboard (Méthode la plus simple)

1. **Ouvrez** votre [Supabase Dashboard](https://supabase.com/dashboard)

2. **Sélectionnez** votre projet Paprika

3. **Allez dans** Edge Functions (sidebar gauche)

4. **Cliquez** sur "Create a new function"

5. **Configurez la fonction** :
   - **Name**: `reset-imports`
   - **Import map URL**: (laisser vide)

6. **Copiez le code** :
   - Ouvrez `supabase/functions/reset-imports/index.ts` dans votre éditeur
   - Copiez TOUT le contenu
   - Collez dans l'éditeur Supabase

7. **Déployez** : Cliquez sur "Deploy function"

8. **Attendez** ~30 secondes pour le déploiement

9. **Notez l'URL** : Elle ressemblera à :
   ```
   https://your-project-ref.supabase.co/functions/v1/reset-imports
   ```

---

## 📋 Étape 2 : Tester la Fonction Manuellement

### Option A : Via le Dashboard

1. Dans la page de votre fonction, cliquez sur **"Invoke function"**
2. Laissez le body vide
3. Cliquez sur **"Send request"**
4. Vous devriez voir une réponse :
   ```json
   {
     "success": true,
     "message": "Import counters reset successfully",
     "usersReset": 0,
     "timestamp": "2025-11-11T16:25:00.000Z"
   }
   ```

### Option B : Via cURL

```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/reset-imports' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

**Note** : `usersReset: 0` est normal si vous testez dans le même mois. La fonction ne réinitialise que si le mois a changé.

---

## 📋 Étape 3 : Planifier l'Exécution Automatique

### Méthode 1 : Via pg_cron (Supabase intégré)

1. **Allez dans** Database → SQL Editor

2. **Créez une nouvelle query**

3. **Copiez/collez** ce code :

```sql
-- Activer l'extension pg_net si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Créer une fonction qui appelle l'Edge Function
CREATE OR REPLACE FUNCTION call_reset_imports()
RETURNS void AS $$
DECLARE
  function_url TEXT := 'https://your-project-ref.supabase.co/functions/v1/reset-imports';
  service_key TEXT := 'YOUR_SERVICE_ROLE_KEY';
BEGIN
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type', 'application/json'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer un cron job qui s'exécute tous les jours à 1h du matin (UTC)
SELECT cron.schedule(
  'reset-monthly-imports',
  '0 1 * * *',
  $$SELECT call_reset_imports()$$
);
```

4. **Remplacez** :
   - `your-project-ref` par votre vrai project ref
   - `YOUR_SERVICE_ROLE_KEY` par votre vraie service role key (Settings → API)

5. **Exécutez** la query

6. **Vérifiez** que le cron job est créé :
   ```sql
   SELECT * FROM cron.job;
   ```

✅ **C'est tout !** La fonction s'exécutera automatiquement tous les jours à 1h du matin UTC.

---

### Méthode 2 : Via un Service Externe (Alternative gratuite)

Si pg_cron ne fonctionne pas (nécessite parfois Supabase Pro), utilisez [cron-job.org](https://cron-job.org) :

1. **Créez un compte** sur [cron-job.org](https://cron-job.org) (gratuit)

2. **Créez un nouveau cron job** :
   - **Title**: Reset Paprika Imports
   - **URL**: `https://your-project-ref.supabase.co/functions/v1/reset-imports`
   - **Schedule**: Daily at 01:00 (UTC)
   - **Request method**: POST
   - **Headers** :
     - Key: `Authorization`
     - Value: `Bearer YOUR_ANON_KEY`

3. **Activez** le job

4. **Testez** en cliquant sur "Run now"

✅ **C'est tout !** Le service appellera votre fonction automatiquement.

---

## 📋 Étape 4 : Vérifier que Tout Fonctionne

### Test 1 : Vérifier les logs de l'Edge Function

1. **Allez dans** Edge Functions → reset-imports → Logs
2. **Regardez** les dernières exécutions
3. Vous devriez voir des logs avec `success: true`

### Test 2 : Vérifier la base de données

```sql
-- Vérifier le dernier reset
SELECT email, last_import_reset, imports_this_month
FROM users
ORDER BY last_import_reset DESC
LIMIT 5;
```

### Test 3 : Tester le comportement freemium

1. Créez un utilisateur test
2. Incrémentez ses imports à 5 :
   ```sql
   UPDATE users
   SET imports_this_month = 5
   WHERE id = 'your-user-id';
   ```
3. Essayez d'appeler `check_import_limit('your-user-id')` → devrait retourner `false`
4. Appelez la fonction reset (ou changez manuellement `last_import_reset` au mois précédent)
5. Réessayez `check_import_limit('your-user-id')` → devrait retourner `true`

---

## 🎉 C'est Terminé !

Votre système de reset automatique est maintenant en place :

- ✅ Edge Function déployée
- ✅ Cron job configuré
- ✅ Exécution automatique tous les jours
- ✅ Les utilisateurs gratuits auront leurs 5 imports/mois réinitialisés automatiquement

---

## 🐛 Troubleshooting

### La fonction ne s'exécute pas
➡️ Vérifiez les logs dans Dashboard → Edge Functions → Logs

### "reset_imports_counter does not exist"
➡️ Vérifiez que vous avez bien exécuté le `schema.sql`

### Cron job n'apparaît pas
➡️ Vérifiez que pg_cron est activé (peut nécessiter Supabase Pro). Utilisez alternative externe.

### usersReset est toujours 0
➡️ Normal si vous testez dans le même mois. La fonction ne reset que quand le mois change.

---

## 📊 Monitoring

**Combien ça coûte ?**
- Edge Functions : 2M invocations/mois GRATUIT
- Daily cron : ~30 invocations/mois
- Coût : **€0** (bien dans le free tier !)

**Logs** :
- Accessibles dans Dashboard → Edge Functions → reset-imports → Logs
- Historique de 7 jours

---

**Besoin d'aide ?** Consultez `supabase/functions/README.md` pour plus de détails.

**Tout fonctionne ?** Vous pouvez maintenant passer à l'implémentation des features suivantes ! 🚀

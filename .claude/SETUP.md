# Claude Code Configuration - Paprika Project

Ce dossier contient la configuration Claude Code pour le projet Paprika, incluant les règles système, les agents spécialisés, et les hooks.

## 📁 Structure

```
.claude/
├── SETUP.md                    # Ce fichier - Documentation de configuration
├── system.md                   # Règles système - Lu automatiquement à chaque session
├── settings.local.json         # Permissions et configuration locale
├── commands/
│   ├── README.md              # Documentation des agents
│   ├── frontend-dev.md        # Agent développement frontend
│   ├── supabase-dev.md        # Agent développement backend
│   ├── test-dev.md            # Agent tests
│   ├── lead-review.md         # Agent review de code
│   ├── build-feature.md       # Agent orchestrateur
│   └── update-status.md       # Agent mise à jour documentation
```

---

## 🤖 Règles Système Automatiques

### Fichier: `system.md`

Ce fichier est **automatiquement lu au démarrage de chaque nouvelle session** Claude Code.

**Il contient:**
- ✅ Instructions pour lire les documents essentiels du projet
- ✅ Résumé de l'architecture et du tech stack
- ✅ Patterns de code à suivre
- ✅ Règles de sécurité et de qualité
- ✅ Liste des agents disponibles
- ✅ Rappel de mettre à jour le status report

**Documents lus automatiquement:**
1. `docs/Paprika-status-report.md` - État actuel du projet
2. `docs/Paprika-data-model.md` - Schéma base de données
3. `docs/Paprika-vision.md` - Vision et objectifs
4. `docs/Paprika-design-system.md` - Design system

### Pourquoi c'est utile ?

À chaque nouvelle session, Claude :
- ✅ Comprend immédiatement l'état du projet
- ✅ Connaît ce qui est implémenté et ce qui manque
- ✅ Sait quels patterns suivre
- ✅ Respecte automatiquement l'architecture
- ✅ Suggère les bons agents pour chaque tâche

---

## 🛠️ Agents de Développement

### 1. `/frontend-dev` - Développeur Frontend
**Usage:**
```
/frontend-dev
Crée un écran ProfileScreen pour éditer le profil utilisateur
```

**Fait:**
- Crée des screens React Native
- Utilise le design system
- Intègre avec la navigation
- Suit les patterns établis

---

### 2. `/supabase-dev` - Développeur Backend
**Usage:**
```
/supabase-dev
Crée les tables grocery_lists et grocery_items avec RLS policies
```

**Fait:**
- Conçoit les schémas de base de données
- Crée les RLS policies
- Implémente les services TypeScript
- Crée les fonctions PostgreSQL

---

### 3. `/test-dev` - Ingénieur Tests
**Usage:**
```
/test-dev
Configure Jest et crée des tests pour RecipeService
```

**Fait:**
- Configure Jest + Testing Library
- Écrit des tests unitaires
- Crée des tests de composants
- Teste les hooks personnalisés

---

### 4. `/lead-review` - Lead Developer / Reviewer
**Usage:**
```
/lead-review
Review le code de RecipeDetailScreen
```

**Fait:**
- Review la qualité du code
- Vérifie la conformité architecturale
- Identifie les problèmes de performance
- Suggère des améliorations

---

### 5. `/build-feature` - Orchestrateur de Features
**Usage:**
```
/build-feature
Implémente la fonctionnalité complète de liste de courses
```

**Fait:**
- Coordonne backend + frontend + tests
- Gère le workflow complet
- Attend les validations entre phases
- Documente le tout

---

### 6. `/update-status` - ⭐ NOUVEAU ⭐ Mise à Jour Documentation
**Usage:**
```
/update-status
J'ai implémenté la feature grocery list
```

**Fait:**
- Analyse les changements
- Calcule les nouveaux pourcentages de complétion
- Met à jour `docs/Paprika-status-report.md`
- Ajoute une section "Dernières Améliorations"
- Ajuste les métriques de qualité

**Quand l'utiliser:**
- ✅ Après avoir implémenté une nouvelle feature
- ✅ Après avoir terminé un écran
- ✅ Après avoir ajouté des tests
- ✅ Quand une phase du projet change de statut

---

## 📝 Workflow Recommandé

### Au Début de Chaque Session

Claude va automatiquement :
1. Lire `system.md` (règles du projet)
2. Lire `docs/Paprika-status-report.md` (état actuel)
3. Lire `docs/Paprika-data-model.md` (schéma DB)
4. Lire `docs/Paprika-vision.md` (contexte)
5. Lire `docs/Paprika-design-system.md` (UI/UX)

Vous n'avez **rien à faire** - c'est automatique ! 🎉

### Pendant le Développement

1. **Donnez une tâche à Claude**
   ```
   Implémente la fonctionnalité de partage de recettes
   ```

2. **Claude va automatiquement :**
   - Analyser la demande
   - Choisir le bon agent (`/build-feature` dans ce cas)
   - Proposer un plan
   - Attendre votre validation
   - Exécuter étape par étape

3. **Après l'implémentation :**
   ```
   /update-status
   J'ai implémenté le partage de recettes avec génération de liens
   ```

4. **Claude va :**
   - Mettre à jour le status report
   - Calculer les nouveaux pourcentages
   - Documenter les changements

### Mode Manuel (si vous préférez)

Vous pouvez aussi invoquer les agents directement :
```
/frontend-dev
/supabase-dev
/test-dev
/lead-review
/build-feature
/update-status
```

---

## ⚙️ Configuration

### Permissions (settings.local.json)

Actuellement configuré pour autoriser automatiquement :
- ✅ `npx expo install --fix`
- ✅ `npm install:*`

Pour ajouter d'autres permissions :
```json
{
  "permissions": {
    "allow": [
      "Bash(npx expo install --fix)",
      "Bash(npm install:*)",
      "Bash(git status)"  // Exemple d'ajout
    ]
  }
}
```

---

## 🎯 Avantages de Cette Configuration

### 1. Lecture Automatique du Contexte
- ✅ Plus besoin de rappeler le contexte à chaque session
- ✅ Claude connaît toujours l'état du projet
- ✅ Suggestions toujours pertinentes

### 2. Documentation Toujours à Jour
- ✅ Le status report reflète la réalité
- ✅ Historique des améliorations tracé
- ✅ Métriques de progression précises

### 3. Agents Spécialisés
- ✅ Chaque agent excelle dans son domaine
- ✅ Code cohérent et de qualité
- ✅ Patterns respectés automatiquement

### 4. Workflow Optimisé
- ✅ Moins de va-et-vient
- ✅ Validations aux bons moments
- ✅ Orchestration automatique

---

## 📊 Exemple Complet de Workflow

### Scenario: Ajouter la fonctionnalité d'export PDF

**Session Start:**
```
Claude lit automatiquement:
✅ system.md
✅ Paprika-status-report.md (voit que export PDF est à 0%)
✅ Paprika-data-model.md
✅ Paprika-vision.md (voit que export PDF est dans le scope)
✅ Paprika-design-system.md
```

**User:**
```
Implémente la fonctionnalité d'export PDF des recettes
```

**Claude:**
```
Je vais invoquer /build-feature pour orchestrer cette implémentation complète...

Phase 1: Backend
- Créer une Edge Function Supabase pour générer le PDF
- Utiliser une librairie comme jsPDF
...

[Continue avec toutes les phases]

Approuvez-vous ce plan ?
```

**User:** `Oui`

**Claude exécute:**
- ✅ Backend (Edge Function)
- ✅ Frontend (Bouton + UI)
- ✅ Tests
- ✅ Review

**Après implémentation, User:**
```
/update-status
Export PDF des recettes est maintenant fonctionnel
```

**Claude:**
```
Je vais mettre à jour le status report...

Proposition:
- Complétude générale: 88% → 91% (+3%)
- Phase 3: 15% → 25% (+10%)
- Nouvelle fonctionnalité ajoutée aux "100% Complete"
- Écran RecipeDetailScreen: qualité 9/10 → 9.5/10

Approuvez-vous ?
```

**User:** `Oui`

**Claude:**
```
✅ Status report mis à jour!
- Fichier: docs/Paprika-status-report.md
- Date mise à jour: 24 octobre 2025 - 15h30
- Section "Dernières Améliorations" ajoutée
```

---

## 🚀 Prochaines Étapes

Maintenant que la configuration est en place :

1. **Testez les agents**
   ```
   /frontend-dev
   Aide-moi à améliorer le GroceryScreen
   ```

2. **Implémentez des features**
   ```
   /build-feature
   Implémente l'import de recettes depuis URL
   ```

3. **Maintenez le status report à jour**
   ```
   /update-status
   [Après chaque feature]
   ```

4. **Profitez de la lecture automatique**
   - À chaque nouvelle session, Claude connaît le contexte
   - Plus besoin d'expliquer l'architecture
   - Suggestions toujours pertinentes

---

## ❓ FAQ

**Q: Le system.md est-il vraiment lu automatiquement ?**
R: Oui ! Claude Code lit automatiquement les fichiers `.claude/system.md` au démarrage de chaque session.

**Q: Dois-je utiliser /update-status après chaque petit changement ?**
R: Non, utilisez-le après des **features significatives** (nouveau screen, nouveau service, phase complétée).

**Q: Puis-je modifier les agents ?**
R: Oui ! Éditez les fichiers `.claude/commands/*.md` selon vos besoins.

**Q: Comment désactiver la lecture automatique ?**
R: Renommez ou supprimez `.claude/system.md` (non recommandé).

**Q: Les agents peuvent-ils appeler d'autres agents ?**
R: Oui ! `/build-feature` orchestre les autres agents automatiquement.

---

## 📚 Ressources

- **Documentation Agents:** `.claude/commands/README.md`
- **Règles Système:** `.claude/system.md`
- **Status Report:** `docs/Paprika-status-report.md`
- **Data Model:** `docs/Paprika-data-model.md`

---

**Configuration créée le:** 24 octobre 2025
**Dernière mise à jour:** 24 octobre 2025

Bon développement avec Paprika ! 🚀

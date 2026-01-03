# Features TODO - Paprika

*Dernière mise à jour : 3 janvier 2026*

---

## 🎯 **Priorités pour la sortie (Critical)**

### 1. **Meal Planning : Limitation Freemium** ⚠️
**Statut** : À implémenter
**Priorité** : Haute

**Fonctionnalité** :
- **Free** : 1 semaine de planning (semaine actuelle uniquement)
- **Premium** : Illimité (planifier 4-8 semaines à l'avance)

**Implémentation** :
- Modifier `MealPlanScreen` pour bloquer navigation vers semaines futures (free users)
- Afficher paywall "Passez à Premium pour planifier plusieurs semaines"
- Backend : Pas de changement DB nécessaire (logique frontend uniquement)

**Estimation** : 2-3h

---

### 2. **Collections Intelligentes : Auto-tags IA** 🤖
**Statut** : À implémenter
**Priorité** : Haute (important pour découvrabilité)

**Fonctionnalité** :
- Auto-tagging des recettes via IA lors de l'import :
  - Type : "Végétarien", "Vegan", "Sans gluten", "Sans lactose"
  - Vitesse : "Rapide (<30min)", "Moyen (30-60min)", "Long (>1h)"
  - Occasion : "Apéritif", "Entrée", "Plat", "Dessert"
  - Cuisine : "Française", "Italienne", "Asiatique", etc.
- Tags stockés dans le champ `tags: TEXT[]` de la table `recipes`
- UI : Chips de tags sur les cards recettes

**Implémentation** :
1. Modifier l'Edge Function `recipe-import` pour inclure tags dans le prompt IA
2. Ajouter validation des tags (liste prédéfinie)
3. Stocker dans le champ `tags` (déjà existant dans DB)
4. Composant `RecipeCard` : Afficher les tags comme chips
5. Filtres : Ajouter dans la recherche (Phase 2)

**Estimation** : 4-6h

---

### 3. **Recherche Avancée : Filtres Combinés** 🔍
**Statut** : À implémenter
**Priorité** : Haute (important pour UX)

**Fonctionnalité** :
- Filtres combinables :
  - Par ingrédients : "tomates, basilic" → recettes contenant ces ingrédients
  - Par temps de préparation : <30min, 30-60min, >1h
  - Par difficulté : Facile, Moyen, Difficile
  - Par tags : Végétarien, Rapide, etc.
- UI : Modal de filtres avec checkboxes + range sliders
- Résultats en temps réel

**Implémentation** :
1. Créer `RecipeFiltersModal` component
2. État de filtres dans `RecipesScreen` (ou Zustand global)
3. Query Supabase avec filtres combinés (WHERE clauses)
4. Full-text search sur ingrédients (index `idx_recipes_search` déjà créé)
5. Badge "X filtres actifs" + bouton "Réinitialiser"

**Estimation** : 6-8h

---

### 4. **Export PDF Professionnel** 📄
**Statut** : À implémenter
**Priorité** : **TRÈS HAUTE** (feature premium importante)

**Fonctionnalité** :
- Export d'une recette en PDF avec mise en page pro :
  - Image de couverture
  - Titre + description
  - Temps de préparation + cuisson + portions
  - Ingrédients avec quantités
  - Étapes numérotées
  - Informations nutritionnelles (si calculées)
  - Footer : "Créé avec Paprika"
- **Premium only** : Paywall pour users free
- Partage direct du PDF (mail, AirDrop, WhatsApp, etc.)

**Stack technique** :
- **Option 1** : `react-native-html-to-pdf` (recommandé)
  - Template HTML/CSS
  - Génération native iOS/Android
  - Pas besoin de backend
- **Option 2** : Edge Function avec Puppeteer
  - Plus de contrôle sur le rendu
  - Coût serveur
- **Option 3** : `@react-pdf/renderer`
  - React components → PDF
  - Bon pour layouts complexes

**Implémentation** (Option 1 recommandée) :
1. Installer `react-native-html-to-pdf`
2. Créer template HTML/CSS pour recette
3. Fonction `generateRecipePDF(recipe)` dans `RecipeService`
4. Bouton "Exporter en PDF" dans `RecipeDetailScreen`
5. Check premium status → paywall si free
6. Partage natif avec `expo-sharing`

**Estimation** : 8-12h (inclus design du PDF)

---

## 📋 **Features Intéressantes (Nice-to-Have)**

### 5. **Partage Public de Recettes** 🔗
**Statut** : À noter pour plus tard
**Priorité** : Moyenne

**Fonctionnalité** :
- Générer URL publique pour partager une recette : `paprika.app/r/abc123`
- Page publique responsive (web uniquement)
- Bouton "Ouvrir dans l'app" (deep link)
- Analytics : Nombre de vues

**Implémentation** :
- Nouveau champ `public_slug: TEXT UNIQUE` dans table `recipes`
- Edge Function pour générer slug unique (nanoid)
- Route web publique `/r/[slug]` (Next.js ou simple HTML)
- Désactiver RLS pour recettes publiques (via flag `is_public`)

**Estimation** : 12-16h (inclus web app)

---

### 6. **QR Code Import** 📱
**Statut** : À noter pour plus tard
**Priorité** : Basse

**Fonctionnalité** :
- Générer QR code pour une recette partagée
- Scanner QR code pour importer directement dans l'app
- Use case : Partage entre amis, recettes imprimées

**Implémentation** :
- `react-native-qrcode-svg` pour génération
- `expo-camera` + `expo-barcode-scanner` pour scan
- QR code → URL publique → Import

**Estimation** : 4-6h

---

## 🔮 **Features Futures (Post-Launch)**

### 7. **Mode Hors-Ligne (Offline-First)** ✈️
**Statut** : Post-launch
**Priorité** : Moyenne

**Fonctionnalité** :
- Accéder aux recettes sans connexion
- Éditer hors-ligne → sync auto quand connexion
- Cache local des images

**Complexité** : Très élevée

**Stack technique** :
- WatermelonDB (SQLite + Sync)
- ou TanStack Query persistQueryClient
- Résolution de conflits (last-write-wins)

**Estimation** : 40-60h (feature majeure)

---

### 8. **Synchro Cloud Avancée** ☁️
**Statut** : Post-launch
**Priorité** : Basse (déjà fonctionnel via Supabase)

**Fonctionnalité actuelle** :
- ✅ Sync automatique via Supabase (online-only)
- ✅ Multi-device support

**Améliorations possibles** :
- Indicateur de sync en temps réel
- Résolution de conflits intelligente (si édition simultanée)
- Historique des versions (undo/redo)

**Estimation** : 20-30h

---

### 9. **Suggestions IA pour Meal Planning** 🧠
**Statut** : Post-launch
**Priorité** : Basse

**Fonctionnalité** :
- "Que cuisiner cette semaine avec ce que j'ai ?"
- Suggestions basées sur :
  - Recettes favorites
  - Ingrédients en stock (liste de courses)
  - Équilibre nutritionnel
  - Saison

**Implémentation** :
- Prompt IA avec contexte utilisateur
- Edge Function `meal-suggestions`
- Coût : ~€0.01-0.02 par suggestion

**Estimation** : 16-24h

---

### 10. **Partage de Listes de Courses** 👥
**Statut** : Post-launch
**Priorité** : Moyenne

**Fonctionnalité** :
- Partager une liste avec d'autres utilisateurs (coloc, famille)
- Édition collaborative en temps réel
- Notifications quand item coché

**Implémentation** :
- Table `grocery_list_shares` (list_id, user_id, role)
- Supabase Realtime pour sync live
- Permissions (owner, editor, viewer)

**Estimation** : 20-30h

---

## 📊 **Récapitulatif des Priorités**

| Feature | Priorité | Estimation | Statut |
|---------|----------|------------|--------|
| 1. Meal Planning Freemium Limit | 🔴 Haute | 2-3h | À faire |
| 2. Collections Intelligentes (Auto-tags) | 🔴 Haute | 4-6h | À faire |
| 3. Recherche Avancée | 🔴 Haute | 6-8h | À faire |
| 4. **Export PDF** | 🔴 **TRÈS HAUTE** | 8-12h | À faire |
| 5. Partage Public Recettes | 🟡 Moyenne | 12-16h | Nice-to-have |
| 6. QR Code Import | 🟢 Basse | 4-6h | Nice-to-have |
| 7. Mode Hors-Ligne | 🟢 Post-launch | 40-60h | Future |
| 8. Synchro Cloud Avancée | 🟢 Post-launch | 20-30h | Future |
| 9. Suggestions IA Meal Planning | 🟢 Post-launch | 16-24h | Future |
| 10. Partage Listes Collaboratives | 🟡 Post-launch | 20-30h | Future |

---

## 🎯 **Plan d'Action Recommandé**

### **Sprint 1 : Features Critiques (Estimation : 20-29h)**
1. Export PDF (8-12h) - **Priorité absolue**
2. Collections Intelligentes (4-6h)
3. Recherche Avancée (6-8h)
4. Meal Planning Freemium (2-3h)

### **Sprint 2 : Nice-to-Have (Estimation : 16-22h)**
5. Partage Public Recettes (12-16h)
6. QR Code Import (4-6h)

### **Post-Launch : Features Futures**
7-10. Features listées ci-dessus selon feedback utilisateurs

---

## 📝 **Notes Importantes**

### **Décisions de Design**
- ❌ **Pas de thème personnalisé** (confirmé par user)
- ✅ Conserver Design System "Warm & Cozy" actuel
- ✅ Prioriser simplicité et performance

### **Freemium Strategy**
- Meal Planning : 1 semaine free, illimité premium
- Export PDF : Premium only (bonne valeur perçue)
- Collections & Recherche : Disponible pour tous (améliore découvrabilité)

### **Stack Technique Validé**
- React Native + Expo (mobile-first)
- Supabase (backend + auth + storage)
- Anthropic Claude / DeepSeek (IA)
- StyleSheet natif (pas NativeWind)

---

**Maintenu par** : Équipe Paprika
**Dernière révision** : 3 janvier 2026

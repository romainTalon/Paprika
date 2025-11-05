# **Paprika - Vision du Projet V2.0**

*Dernière mise à jour : 31 octobre 2025*

---

## **1. Vision Produit**

### **1.1 Mission**
**Paprika simplifie la vie en cuisine en offrant une solution complète pour gérer ses recettes, planifier ses repas et automatiser sa liste de courses avec l'aide de l'intelligence artificielle.**

### **1.2 Problème Résolu**
- **Désorganisation** : Recettes éparpillées (papier, bookmarks, screenshots)
- **Perte de temps** : Planification des repas fastidieuse
- **Courses inefficaces** : Oublis, doublons, mauvaises quantités
- **Manque d'information** : Pas de visibilité sur l'apport nutritionnel
- **Import compliqué** : Difficulté à sauvegarder des recettes du web

### **1.3 Solution Paprika**
**Une application mobile tout-en-un qui :**
- Organise les recettes dans des cookbooks thématiques
- Importe intelligemment des recettes depuis n'importe quelle source (web, photo, texte) **avec IA**
- Planifie les repas hebdomadaires visuellement
- Génère automatiquement la liste de courses **avec calcul des portions**
- Affiche les informations nutritionnelles **calculées automatiquement par IA**
- Optimise le temps et l'argent en cuisine

---

## **2. Public Cible**

### **2.1 Persona Principal : "Sophie, la Maman Organisée"**
- **Âge** : 30-45 ans
- **Situation** : Famille avec enfants, actifs professionnellement
- **Pain points** :
  - "Je perds du temps à chercher quoi faire à manger"
  - "Je vais au supermarché 3 fois par semaine car j'oublie des choses"
  - "Je ne sais jamais combien acheter pour 4 personnes"
  - "J'aimerais mieux manger mais c'est compliqué de suivre"
- **Motivation** : Gagner du temps, réduire le stress, bien nourrir sa famille

### **2.2 Persona Secondaire : "Thomas, le Jeune Actif"**
- **Âge** : 25-35 ans
- **Situation** : Célibataire ou en couple, début de carrière
- **Pain points** :
  - "Je mange toujours la même chose par manque d'inspiration"
  - "Les recettes web sont pleines de pub et difficiles à suivre"
  - "Je ne sais pas ajuster les portions pour 1 personne"
  - "Je veux manger plus équilibré mais je ne sais pas calculer les calories"
- **Motivation** : Découvrir de nouvelles recettes, manger mieux, économiser

---

## **3. Positionnement Marché**

### **3.1 Concurrents Directs**
- **Jow** : Focus liste de courses + livraison
- **Marmiton** : Bibliothèque de recettes communautaire
- **Mealime** : Meal planning avec recettes pré-définies
- **Yummly** : Recherche et sauvegarde de recettes

### **3.2 Différenciateurs Paprika**
1. **Import IA hybride intelligent** : 
   - JSON-LD + scraping HTML + Vision AI en fallback
   - Fonctionne sur n'importe quel site (pas seulement les gros sites)
   - Extraction d'images, temps, portions automatique
   
2. **Nutrition automatique multilingue** :
   - OpenFoodFacts (gratuit) + IA en fallback
   - Calcul par recette et par portion
   - Support français/international
   - Images d'ingrédients automatiques

3. **Organisation flexible** : Cookbooks personnalisés, pas de recettes imposées

4. **Simplicité d'usage** : Interface "Warm & Cozy", intuitive, rapide

5. **Tout-en-un** : Cookbooks + Meal Planning + Grocery + Nutrition dans une seule app

---

## **4. Architecture MVP - 4 Sections Principales**

### **4.1 Section Cookbooks**
**Objectif** : Organiser ses recettes par thème
- Liste des cookbooks (grille visuelle)
- Gestion CRUD des cookbooks (nom, description, couverture)
- Liste des recettes par cookbook
- Fiche recette complète avec toutes les informations
- **Nutrition affichée automatiquement**

### **4.2 Section Meal Plan**
**Objectif** : Planifier ses repas de la semaine
- Vue calendrier hebdomadaire
- 4 slots par jour : breakfast, lunch, dinner, snack
- Sélection recettes depuis les cookbooks
- Notes personnelles par repas
- Navigation entre semaines
- **Vision nutritionnelle de la semaine**

### **4.3 Section Grocery**
**Objectif** : Gérer sa liste de courses
- Ajout manuel d'items (nom, quantité, notes)
- Import automatique depuis recettes (avec calcul portions)
- **Images d'ingrédients automatiques**
- System de checkbox pour marquer "acheté"
- Catégorisation automatique des items (9 catégories)

### **4.4 Section Data**
**Objectif** : Suivre ses informations nutritionnelles
- Dashboard des données nutrition par recette
- Calculs automatiques depuis les ingrédients **via IA + OpenFoodFacts**
- Vue hebdomadaire depuis le meal plan
- Macros et micros détaillés

---

## **5. Navigation et Ergonomie**

### **5.1 Structure de Navigation**
Bottom Tab Navigation (5 onglets)
- Cookbooks
- Meal Plan
- [ADD] (bouton central)
- Grocery
- Data

### **5.2 Bouton ADD Central**
**4 méthodes d'ajout de recettes :**
1. **Import Web avec IA** : Coller une URL → extraction automatique intelligente (JSON-LD → HTML+LLM → Vision AI)
2. **Photo OCR** : Scanner une recette depuis un livre/magazine *(à venir)*
3. **Texte libre** : Coller du texte depuis n'importe où *(à venir)*
4. **Création manuelle** : Formulaire complet

---

## **6. Fonctionnalités Clés du MVP**

### **6.1 Gestion des Recettes**
- **CRUD complet** : Création, lecture, modification, suppression
- **Import intelligent multi-stratégies** :
  - Stratégie 1 : JSON-LD (gratuit, rapide, ~70% succès)
  - Stratégie 2 : LLM + HTML scraping (~90% succès)
  - Stratégie 3 : Vision AI screenshot (~95% succès)
- **Informations complètes** :
  - Photo principale (extraite automatiquement ou ajoutée manuellement)
  - Note personnelle éditable
  - Cookbook d'appartenance
  - Nombre de parts (ajustable)
  - Liste ingrédients avec quantités et **images automatiques**
  - Étapes détaillées
  - Valeurs nutritionnelles **calculées automatiquement**

### **6.2 Calcul Nutritionnel Intelligent**
**Approche hybride économique :**
1. **Cache Supabase** : Vérification bibliothèque d'ingrédients partagée
2. **OpenFoodFacts** : Base gratuite multilingue (2M+ produits)
3. **Normalisation IA** : GPT-4o-mini parse "200g de tomates" → structure
4. **Estimation IA fallback** : Si ingrédient inconnu, estimation intelligente
5. **Unsplash/IA** : Images d'ingrédients automatiques

**Résultat :** ~$0.01-0.02 par recette, 95%+ précision

### **6.3 Actions sur les Recettes**
- **Ajouter aux courses** : Import ingrédients selon nb de parts
- **Ajouter au meal plan** : Intégration directe au planning
- **Partager** : Réseaux sociaux, export PDF, impression *(à venir)*
- **Édition** : Modification de tous les champs en temps réel
- **Voir nutrition** : Détail complet des macros/micros

### **6.4 Meal Planning**
- **Planning hebdomadaire** : Vue grille 7 jours × 4 repas
- **Gestion des portions** : Ajustement par repas
- **Notes personnelles** : Information supplémentaires par slot
- **Navigation temporelle** : Semaines précédentes/suivantes
- **Vision nutritionnelle** : Total calories/macros de la semaine

### **6.5 Liste de Courses Intelligente**
- **Ajout manuel** : Nom, quantité, notes, **image auto**
- **Import depuis recettes** : Calcul automatique des quantités
- **Regroupement intelligent** : Ingrédients identiques fusionnés
- **Catégorisation auto** : 9 catégories avec emojis
- **Mode shopping** : Checkboxes avec état persistant
- **Images d'ingrédients** : Unsplash ou génération IA

---

## **7. Stack Technique V2.0**

### **7.1 Frontend**
- **React Native 0.76+** : Application mobile native iOS/Android
- **Expo 52+** : Développement rapide, OTA updates, EAS Build
- **TypeScript 5.x (strict mode)** : Type safety maximale
- **Expo Router** : Navigation file-based moderne
- **NativeWind** : Tailwind CSS pour React Native
- **axios + cheerio** : Import web et scraping HTML

### **7.2 Backend & Database**
- **Supabase** :
  - **PostgreSQL 15+** : Base de données relationnelle
  - **Supabase Auth** : Authentification (Email, Google, Apple)
  - **Storage** : Images recettes et profils
  - **Edge Functions** : Import IA, webhooks Stripe
  - **Realtime** : Synchronisation temps réel
  
- **Drizzle ORM** :
  - Type-safety excellente avec inférence automatique
  - Migrations versionnées
  - Queries optimisées
  - Mix avec Supabase client pour realtime/storage

### **7.3 APIs & Services IA**
- **Anthropic Claude 3.5 Sonnet** :
  - Parsing intelligent d'ingrédients
  - Extraction recettes depuis HTML
  - Vision AI pour screenshots
  - Normalisation multilingue FR/EN
  - Budget : ~$0.01 par import
  
- **OpenFoodFacts API** :
  - Base nutritionnelle gratuite
  - 2M+ produits internationaux
  - Excellent focus produits français
  - Données détaillées (macros + micros + Nutri-Score)
  
- **Unsplash API** :
  - Images d'ingrédients HD gratuites (50 requêtes/heure)
  - Fallback : génération DALL-E 3 si besoin ($0.04/image)

### **7.4 Paiements & Monétisation**
- **Stripe** : 
  - Abonnements récurrents (€4.99/mois, €49.99/an)
  - Apple Pay / Google Pay natifs
  - Webhooks pour sync subscriptions
  - Fees : 2.9% + €0.30 par transaction

### **7.5 Emails & Engagement**
- **Resend** :
  - Templates React Email (JSX/TSX)
  - Séquences onboarding automatiques
  - Emails réengagement utilisateurs inactifs
  - 3000 emails/mois gratuits

### **7.6 Analytics & Monitoring**
- **PostHog** : Analytics + Session replay + Feature flags (open-source)
- **Sentry** : Error tracking production
- **Supabase Logs** : Logging Edge Functions

---

## **8. Modèle Freemium (Sans Trial)**

### **8.1 Version Gratuite**
- ✅ **2 cookbooks maximum**
- ✅ **20 recettes maximum**
- ✅ **5 imports IA/mois** (renouvellement automatique mensuel)
- ✅ **1 liste de courses**
- ✅ **Meal planning illimité** (feature différenciante)
- ✅ **Calculs nutritionnels basiques**
- ℹ️ **Publicités discrètes** (non-intrusives)

**Durée :** ♾️ **Illimitée dans le temps** (pas de trial limité)

**Philosophie :** 0 friction à l'inscription, l'utilisateur découvre naturellement la valeur de l'app et upgrade quand il en a besoin.

### **8.2 Version Premium (€4.99/mois ou €49.99/an)**
- ♾️ **Cookbooks illimités**
- ♾️ **Recettes illimitées**
- ♾️ **Imports IA illimités** (JSON-LD + LLM + Vision AI)
- ♾️ **Listes de courses illimitées**
- ✅ **Export PDF professionnel**
- ✅ **Analytics nutrition avancées**
- ✅ **Synchronisation multi-devices**
- ✅ **Support prioritaire**
- ✅ **Sans publicités**

**Économie annuelle :** €49.99/an = €4.16/mois (save 17%)

### **8.3 Stratégie d'Acquisition (0 Friction)**

**Pas de demande de carte bancaire à l'inscription** ✅
- Téléchargement → Utilisation immédiate
- Découverte naturelle des fonctionnalités
- Upsell contextuel quand limite atteinte

**Moments d'upgrade naturels :**
1. **Limite recettes** (20 atteintes) : "Débloquez recettes illimitées"
2. **Limite imports** (5 utilisés) : "Imports illimités pour gagner du temps"
3. **Besoin cookbooks** (2 remplis) : "Organisez mieux avec cookbooks illimités"
4. **J+7 utilisateur actif** : Offre découverte Premium

**Paywalls "Warm & Cozy" :**
- Design amical, pas agressif
- Toujours dismissable
- Benefits visuels clairs
- Compteurs gamifiés (3/5 imports restants 🌟)

### **8.4 Offres Promotionnelles**

**Offre de Lancement** (Premiers 1000 users) :
- Premier mois : **€1.99** (au lieu de €4.99)
- Message : "Rejoignez les pionniers Premium !"

**Black Friday / Périodes clés** :
- Année complète : **€39.99** (au lieu de €49.99)
- Économie : 20%

**Parrainage** :
- Parrain : 1 mois gratuit
- Filleul : 1 mois à -50% (€2.49)

### **8.5 Conversion Target**

**Objectifs réalistes :**
- **10-15% free → premium** après 30 jours d'utilisation
- **40% retention D7** (free + premium)
- **25% retention D30** (free + premium)
- **LTV premium** : €50+ (10+ mois d'abonnement moyen)

**Vs approche Trial :**
- Trial avec CB : 5% conversion sur 50 users = 2-3 premium
- Freemium : 12% conversion sur 500 users = 60 premium
- **Freemium = 20-30x plus de revenus** 💰

---

## **9. Coûts Techniques Estimés**

### **9.1 Par Utilisateur Actif/Mois**

| Service | Usage | Coût |
|---------|-------|------|
| **Supabase** | DB + Auth + Storage | $0.05 |
| **Anthropic Claude** | 10 imports + parsing | $0.10 |
| **OpenFoodFacts** | Nutrition | Gratuit |
| **Unsplash** | Images ingrédients | Gratuit |
| **DALL-E 3** | 1-2 images rares | $0.04-0.08 |
| **Resend** | 10 emails | $0.007 |
| **PostHog** | Analytics | Gratuit (< 1M events) |
| **Total technique** | | **~$0.24-0.30/user/mois** |

**Avec marge sécurité : ~$0.35-0.55/user/mois**

### **Coûts Fixes Mensuels**

| Service | Coût |
|---------|------|
| Supabase (Production) | $25 |
| Domaine + Hosting | $4 |
| Sentry (Monitoring) | $26 |
| **Total fixe** | **$55/mois** |

**Avec 70% utilisateurs free, 30% premium :**
- Revenu moyen : €1.50/user/mois (€4.99 × 30%)
- Coût : $0.35-0.55/user/mois (€0.32-0.50)
- **Marge brute : 65-70%** ✅

**Break-even : ~40-60 users premium** (€4.99/mois) pour couvrir fixes + variables

---

## **10. Roadmap Technique V2.0**

### **Phase 1 - Foundation** ✅ (100%)
- Setup technique complet
- Authentification Supabase
- Design system "Warm & Cozy"
- Navigation configurée

### **Phase 2 - Core Features** ✅ (100%)
- Cookbooks CRUD
- Recettes CRUD + création manuelle
- Meal Planning complet
- Listes de courses avec multi-listes

### **Phase 3 - IA & Import** 🔄 (90%)
- ✅ Import web hybride (JSON-LD + scraping HTML + images + temps)
- ✅ Calculs nutritionnels automatiques (OpenFoodFacts + IA)
- ✅ Images d'ingrédients (Unsplash + cache)
- 🔄 Vision AI import (screenshots) - *À finaliser*
- 🔄 OCR photos recettes - *À développer*

### **Phase 4 - Polish & Launch** 🔜 (0%)
- Tests utilisateurs
- Export PDF professionnel
- Système d'emails (onboarding, réengagement)
- Partage social
- Analytics avancées
- Préparation stores (Apple, Google)
- Landing page marketing
- Launch strategy

---

## **11. Métriques de Succès**

### **11.1 Acquisition**
- **1000 téléchargements** à J+30
- **CAC < €10** via marketing organique + paid
- **Rating stores > 4.5 étoiles**

### **11.2 Activation**
- **70%+ créent première recette** dans les 24h
- **50%+ ajoutent 3+ recettes** en semaine 1
- **40%+ utilisent meal planning** en semaine 1

### **11.3 Rétention**
- **D7 : 40%+** (J+7 retention)
- **D30 : 25%+** (J+30 retention)
- **Sessions/semaine : 3+** pour utilisateurs actifs

### **11.4 Monétisation**
- **15-20% conversion free → premium** à J+30
- **LTV > €50** (lifetime value)
- **Churn < 5%/mois** pour premium

---

## **12. Vision Long Terme (V2+)**

### **12.1 Fonctionnalités Futures**
- **Communauté** : Partage de cookbooks publics
- **IA Coach** : Suggestions personnalisées repas/nutrition
- **Smart Shopping** : Intégration drive/livraison automatique
- **IoT** : Connexion électroménager (Thermomix, four connecté)
- **AR Cooking** : Instructions en réalité augmentée

### **12.2 Expansion Marchés**
- **Phase 1** : France (2025)
- **Phase 2** : Europe francophone (Belgique, Suisse, 2026)
- **Phase 3** : Europe anglophone (UK, Irlande, 2026)
- **Phase 4** : USA/Canada (2027)

---

*Document Vision V2.0 - Mise à jour avec approches IA modernes*
*Paprika - L'app qui simplifie la cuisine avec l'intelligence artificielle* 🍳✨

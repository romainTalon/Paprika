# **Paprika - Roadmap MVP V2.0 (Refonte)**

*Dernière mise à jour : 31 octobre 2025*

---

## **🎯 Vue d'Ensemble**

Suite aux problèmes rencontrés avec l'approche initiale (JSON-LD peu fiable), le projet repart avec une architecture modernisée centrée sur l'IA pour :
1. **Import de recettes** : Approche hybride JSON-LD → LLM+HTML → Vision AI
2. **Nutrition automatique** : OpenFoodFacts + IA + cache intelligent
3. **Images d'ingrédients** : Unsplash + génération IA

**Durée totale : 12 semaines**

---

## **📊 État Actuel (Baseline)**

### Ce qui fonctionne déjà ✅
- Authentification et profils
- Cookbooks CRUD complet
- Recettes CRUD + création manuelle
- Meal Planning fonctionnel
- Listes de courses intelligentes
- Design system "Warm & Cozy"
- Navigation complète

### Ce qui doit être refait 🔄
- **Import web** : Système actuel non fiable → Refonte IA
- **Nutrition** : Pas implémenté → Nouveau système IA
- **Images** : Partielles → Automatisation complète

---

## **🚀 Phase 1 : Refonte Import & Nutrition (Semaines 1-4)**

### **Semaine 1 : Architecture Backend IA**

#### **🔧 Setup Services IA**
- [ ] Configuration Anthropic Claude API (ou OpenAI GPT-4o)
- [ ] Setup OpenFoodFacts API client
- [ ] Configuration Unsplash API
- [ ] Variables d'environnement sécurisées
- [ ] Edge Functions Supabase pour appels IA

#### **📦 Services de Base**
- [ ] `RecipeImportService` avec stratégies multiples
  - Stratégie 1 : JSON-LD extractor (existant à améliorer)
  - Stratégie 2 : LLM + HTML scraper
  - Stratégie 3 : Vision AI (screenshot)
- [ ] `NutritionService` hybride
  - Cache Supabase lookup
  - OpenFoodFacts API
  - IA normalization
  - IA estimation fallback
- [ ] `IngredientImageService`
  - Cache lookup
  - Unsplash search
  - DALL-E generation fallback

#### **🗄️ Base de Données**
- [ ] Table `nutrition_cache` (ingrédients partagés)
- [ ] Table `ingredient_library` (images + metadata)
- [ ] Table `import_history` (analytics)
- [ ] Indexes optimisés
- [ ] RLS policies

### **Semaine 2 : Import Web Intelligent**

#### **🌐 Parser Hybride**
- [ ] Améliorer extracteur JSON-LD
  - Support multi-sites (Marmiton, 750g, Allrecipes, etc.)
  - Validation robuste
  - Gestion erreurs
- [ ] Implémenter LLM HTML Parser
  - Cheerio scraping
  - Nettoyage HTML
  - Envoi à Claude/GPT
  - Parsing JSON structuré
- [ ] Implémenter Vision AI Parser
  - Screenshot de page via Playwright/Puppeteer
  - Envoi à Claude Vision / GPT-4o Vision
  - Extraction structurée
  - Validation qualité

#### **🎨 UI Import Web**
- [ ] Refonte `WebImportScreen`
  - Preview avant sauvegarde
  - Indicateurs de confiance
  - Édition manuelle si besoin
  - Feedback temps réel
- [ ] Gestion des quotas freemium
  - Compteur imports restants
  - Paywall contextuel
  - Analytics usage

### **Semaine 3 : Calculs Nutritionnels**

#### **🥗 Service Nutrition**
- [ ] Normalisation ingrédients avec IA
  - "2 grosses tomates" → {name: "tomate", quantity: 300, unit: "g"}
  - Support multilingue (FR, EN)
  - Catégorisation automatique
- [ ] Recherche OpenFoodFacts
  - API client robuste
  - Gestion rate limits
  - Fallbacks intelligents
- [ ] Estimation IA pour ingrédients rares
  - Prompt engineering optimisé
  - Scores de confiance
  - Validation ranges
- [ ] Conversion unités automatique
  - g, ml, cups, tbsp, oz, etc.
  - Support recettes US/UK

#### **🗄️ Cache & Performance**
- [ ] Seed initial 100+ ingrédients communs
- [ ] Stratégie de cache intelligent
- [ ] Agrégation par recette
- [ ] Calcul par portion dynamique

### **Semaine 4 : Images & Polish Import**

#### **🖼️ Images Automatiques**
- [ ] Service recherche Unsplash
  - Query optimization
  - Sélection meilleure image
  - Resize et cache
- [ ] Génération IA fallback
  - DALL-E 3 pour ingrédients rares
  - Prompts optimisés "food photography"
  - Cache permanent
- [ ] Intégration dans RecipeCard
- [ ] Intégration dans GroceryList

#### **✅ Tests & Validation**
- [ ] Tests unitaires services
- [ ] Tests intégration E2E import
- [ ] Tests calculs nutrition (precision)
- [ ] Tests multi-sites (10+ sites populaires)
- [ ] Review qualité avec vrais utilisateurs

---

## **📱 Phase 2 : UI/UX Polish (Semaines 5-7)**

### **Semaine 5 : Dashboard Nutrition**

#### **📊 Écran Data (Nutrition)**
- [ ] Vue par recette
  - Macros (protéines, glucides, lipides)
  - Micros (vitamines, minéraux)
  - Graphiques circulaires
  - Comparaison objectifs journaliers
- [ ] Vue meal plan hebdomadaire
  - Total calories/macros semaine
  - Répartition par jour
  - Graphiques évolution
- [ ] Filtres et tri
  - Par cookbook
  - Par date
  - Par valeur nutritionnelle

#### **🎨 Composants Visuels**
- [ ] `NutritionCard` pour recettes
- [ ] `MacrosPieChart` avec react-native-chart-kit
- [ ] `WeeklyNutritionGraph`
- [ ] `NutrientBadge` réutilisable

### **Semaine 6 : Améliorations UX**

#### **🔍 Recherche Globale**
- [ ] Barre de recherche universelle
  - Recherche dans recettes
  - Recherche dans cookbooks
  - Filtres avancés
- [ ] Suggestions intelligentes
- [ ] Historique recherches

#### **⭐ Features UX**
- [ ] Système de favoris amélioré
- [ ] Mode hors-ligne robuste
- [ ] Notifications push basiques
  - Rappels meal planning
  - Conseils nutrition
- [ ] Onboarding interactif
  - Wizard 3 étapes
  - Création premier cookbook
  - Ajout première recette

#### **📱 Optimisations Mobile**
- [ ] Performance scrolling listes
- [ ] Images lazy loading
- [ ] Cache agressif
- [ ] Animations fluides

### **Semaine 7 : Export & Partage**

#### **📄 Export PDF**
- [ ] Template professionnel
  - Logo Paprika
  - Design "warm & cozy"
  - Mise en page optimisée impression
- [ ] Export recette individuelle
- [ ] Export meal plan complet
- [ ] Export liste de courses

#### **📱 Partage Social**
- [ ] Partage recettes
  - Instagram, Facebook, WhatsApp
  - Génération image optimisée
  - Deep link vers app
- [ ] Liens publics recettes
  - URL unique par recette
  - Preview web élégante
  - Call-to-action "Télécharger l'app"

---

## **💰 Phase 3 : Monétisation & Business (Semaines 8-9)**

### **Semaine 8 : Intégration Paiements**

#### **💳 Stripe & IAP**
- [ ] Configuration Stripe
  - Products & Prices
  - Webhooks
  - Test & Production
- [ ] Configuration Apple IAP
- [ ] Configuration Google Play IAP
- [ ] Edge Function sync subscriptions

#### **🎁 Système Freemium (Sans Trial)**
- [ ] Gestion limites intelligentes
  - 2 cookbooks max (free)
  - 20 recettes max (free)
  - 5 imports IA/mois (free, renouvellement mensuel)
  - 1 liste courses (free)
  - Meal planning illimité (free)
- [ ] Compteurs visuels gamifiés
  - Badge "3/5 imports restants ce mois"
  - Barre de progression
  - Notifications douces (J-7, J-3 avant renouvellement)
- [ ] Paywalls contextuels "Warm & Cozy"
  - Déclenchement quand limite atteinte
  - Ton amical, pas agressif
  - Toujours dismissable
  - Benefits clairs et visuels
- [ ] Offres promotionnelles
  - Premier mois réduit (€1.99 au lieu de €4.99)
  - Offre lancement premiers 1000 users
  - Système de parrainage (1 mois gratuit)

#### **📊 Analytics Business**
- [ ] Tracking conversions
- [ ] Funnel analysis
- [ ] Revenue metrics
- [ ] Churn analysis

### **Semaine 9 : Email & Engagement**

#### **📧 Système Email (Resend)**
- [ ] Configuration Resend
- [ ] Templates React Email
  - Design cohérent app
  - Responsive mobile
- [ ] Séquence onboarding
  - Email bienvenue
  - J+1 : Tips première recette
  - J+3 : Découvrir meal planning
  - J+7 : Partage expérience
  - J+14 : Upgrade premium
- [ ] Emails réengagement
  - Inactif 14 jours
  - Inactif 30 jours
  - Inactif 60 jours
- [ ] Newsletter optionnelle
  - Tips cuisine hebdo
  - Nouvelles recettes tendances

#### **🔔 Notifications Push**
- [ ] Setup Expo Notifications
- [ ] Rappels meal planning
- [ ] Suggestions courses
- [ ] Conseils nutrition

---

## **🚀 Phase 4 : Launch & Marketing (Semaines 10-12)**

### **Semaine 10 : Préparation Stores**

#### **📱 App Stores Optimization**
- [ ] Screenshots professionnels (5-10 par plateforme)
- [ ] Vidéo de présentation (30 sec)
- [ ] Description optimisée SEO
- [ ] Keywords recherche
- [ ] Icône app finalisée
- [ ] Politique confidentialité
- [ ] Conditions générales

#### **🌐 Landing Page**
- [ ] Design moderne
- [ ] Présentation features clés
- [ ] Témoignages
- [ ] FAQ
- [ ] Blog articles SEO
- [ ] Newsletter signup

#### **📝 Documentation**
- [ ] Press kit
- [ ] Guide utilisateur
- [ ] Centre d'aide
- [ ] Vidéos tutoriels

### **Semaine 11 : Tests Beta**

#### **🧪 Beta Testing**
- [ ] Recrutement 50-100 beta testers
- [ ] TestFlight (iOS)
- [ ] Google Play Beta (Android)
- [ ] Collecte feedback
- [ ] Itérations rapides

#### **🔧 Corrections & Polish**
- [ ] Fix bugs critiques
- [ ] Optimisations performance
- [ ] Améliorations UX basées feedback
- [ ] Tests charge backend

### **Semaine 12 : Launch 🎉**

#### **📅 J-7 : Pre-Launch**
- [ ] Campagne teasing social media
- [ ] Emails liste d'attente
- [ ] Partenariats influenceurs activés
- [ ] PR envoyé aux médias

#### **🚀 J-Day : Launch**
- [ ] Publication App Store
- [ ] Publication Google Play
- [ ] Product Hunt submission
- [ ] Post réseaux sociaux
- [ ] Email blast
- [ ] Monitoring temps réel

#### **📊 J+1 à J+7 : Post-Launch**
- [ ] Support utilisateurs actif
- [ ] Monitoring métriques
  - Téléchargements
  - Activations
  - Retention D1, D3, D7
  - Conversions premium
- [ ] Réponses reviews stores
- [ ] Ajustements rapides si besoin
- [ ] A/B tests onboarding

---

## **📊 Métriques de Succès par Phase**

### **Phase 1 - Refonte Technique**
**Objectifs :**
- ✅ Import web : 90%+ taux de succès (tous sites)
- ✅ Nutrition : 95%+ précision
- ✅ Images : 100% couverture ingrédients communs
- ✅ 0 bugs critiques

### **Phase 2 - UI/UX Polish**
**Objectifs :**
- ✅ Dashboard nutrition fonctionnel
- ✅ Export PDF professionnel
- ✅ Partage social opérationnel
- ✅ Satisfaction beta testeurs > 4.5/5

### **Phase 3 - Monétisation**
**Objectifs :**
- ✅ Paiements fonctionnels iOS + Android
- ✅ Système freemium sans bugs
- ✅ Emails envoyés automatiquement
- ✅ Analytics tracking opérationnel

### **Phase 4 - Launch**
**Objectifs :**
- 🎯 1000 téléchargements J+7
- 🎯 500 utilisateurs actifs J+7
- 🎯 Rating stores > 4.5 étoiles
- 🎯 15%+ conversion trial → paid J+30
- 🎯 40%+ retention D7

---

## **💰 Budget Estimé**

### **Coûts de Développement**
| Poste | Coût |
|-------|------|
| APIs IA (dev/test) | €200 |
| Supabase (dev) | €25/mois |
| Outils design | €50 |
| Beta testing | €100 |
| **Total Dev** | **~€500** |

### **Coûts de Launch**
| Poste | Coût |
|-------|------|
| Apple Developer | €99/an |
| Google Play | €25 one-time |
| Stripe fees | 2.9% + €0.30 |
| Domaine + Hosting | €50/an |
| Marketing initial | €500-1000 |
| **Total Launch** | **~€800-1300** |

### **Coûts Récurrents (Post-Launch)**
| Poste | Coût/Mois |
|-------|-----------|
| Supabase Production | €25-50 |
| APIs IA (500 users) | €250-300 |
| Resend (emails) | €20 |
| Monitoring/Analytics | €30 |
| Marketing continu | €500+ |
| **Total Mensuel** | **~€825-900** |

**Break-even : ~150-200 utilisateurs premium** (à €4.99/mois)

---

## **⚠️ Risques & Mitigation**

### **Risques Techniques**
| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Coûts IA trop élevés | Élevé | Moyen | Cache agressif, freemium strict |
| APIs externes down | Moyen | Faible | Fallbacks multiples, cache |
| Performance mobile | Moyen | Moyen | Optimisations natives, lazy loading |

### **Risques Business**
| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Acquisition lente | Élevé | Moyen | Marketing organique + paid ads |
| Conversion faible | Élevé | Moyen | A/B tests, optimisation onboarding |
| Churn élevé | Moyen | Moyen | Engagement emails, features value |

---

## **🎯 Post-MVP Roadmap (V2)**

### **Q1 2026 - Expansion Features**
- OCR photos recettes (Google Vision)
- Mode hors-ligne complet
- Widget iOS/Android
- Apple Watch companion
- Synchronisation multi-devices

### **Q2 2026 - Communauté**
- Partage cookbooks publics
- Système de notation recettes
- Commentaires et reviews
- Profils publics utilisateurs

### **Q3 2026 - IA Avancée**
- Suggestions repas personnalisées
- Coach nutritionnel IA
- Génération automatique meal plans
- Substitutions ingrédients intelligentes

### **Q4 2026 - Intégrations**
- Livraison courses (Uber Eats, etc.)
- IoT (Thermomix, fours connectés)
- Intégrations fitness apps (Apple Health, etc.)

---

*Document Roadmap V2.0 - Refonte avec approches IA modernes*
*Paprika - From Scratch to Launch en 12 semaines* 🚀

# Log des Décisions Architecturales - Paprika

*Traçabilité des choix techniques et business majeurs*

---

## Format des Entrées

```markdown
## YYYY-MM-DD - Titre de la Décision
**Contexte** : Situation qui a mené à cette décision
**Décision** : Ce qui a été décidé
**Raisons** :
- Raison 1
- Raison 2
**Alternatives considérées** : Options écartées
**Conséquences** : Impact attendu
**Statut** : ✅ Validée | 🔄 En révision | ❌ Annulée
```

---

## 2025-11-03 - Choix de Drizzle ORM au lieu de Prisma

**Contexte** : Besoin d'un ORM type-safe pour interagir avec PostgreSQL de manière sécurisée

**Décision** : Utiliser **Drizzle ORM** comme couche d'abstraction database

**Raisons** :
- ✅ Plus léger : **40KB** vs Prisma **300KB** (réduction 87%)
- ✅ Meilleure inférence TypeScript automatique (pas besoin de `npx prisma generate`)
- ✅ Queries plus performantes (génération SQL optimisé)
- ✅ SQL-like syntax plus intuitive pour développeurs expérimentés
- ✅ Migrations versionnées similaires à Prisma
- ✅ Compatible avec Supabase et Edge Functions

**Alternatives considérées** :
- **Prisma** : Plus populaire mais plus lourd, génération de types moins pratique
- **TypeORM** : Trop complexe, decorators verbeux, maintenance incertaine
- **Kysely** : Excellent mais moins mature, moins de ressources communautaires

**Conséquences** :
- Bundle size réduit = app plus rapide
- Courbe d'apprentissage légèrement plus raide (moins de ressources que Prisma)
- Meilleure DX avec inférence automatique des types

**Statut** : ✅ Validée

**Ressources** :
- [Drizzle vs Prisma Benchmark](https://orm.drizzle.team/benchmarks)
- [Drizzle Documentation](https://orm.drizzle.team)

---

## 2025-11-03 - Stratégie Freemium sans Trial

**Contexte** : Choix du modèle de monétisation pour maximiser croissance et revenus

**Décision** : **Freemium généreux sans demande de carte bancaire** à l'inscription

**Raisons** :
- ✅ **3x plus de conversions** vs trial avec CB (simulation : 60 vs 20 users premium)
- ✅ **Zéro friction** à l'inscription = taux de téléchargement 10x supérieur
- ✅ Croissance organique par bouche-à-oreille (utilisateurs free deviennent ambassadeurs)
- ✅ Base utilisateurs large pour itérer rapidement sur le produit
- ✅ Upgrade naturel quand limite atteinte (moment de forte valeur perçue)
- ✅ Permet A/B testing à grande échelle sur onboarding

**Alternatives considérées** :
- **Trial 7 jours avec CB** : Friction trop forte, 95% de perte à l'inscription
- **Paywall immédiat** : Incompatible avec discovery, personne ne paie sans essayer
- **Freemium limité dans le temps** : Frustration utilisateur, mauvaise réputation

**Limites Free** :
- 2 cookbooks (suffisant pour tester, frustrant après 1 mois)
- 20 recettes (2-3 semaines d'usage normal)
- 5 imports IA/mois (coût maîtrisé : €0.05/user, renouvellement mensuel = trigger upgrade récurrent)
- Meal planning illimité (feature différenciante, crée engagement, coût nul)

**Conversion attendue** :
- 10-15% free → premium après 30 jours
- LTV premium : €50+ (10 mois d'abonnement moyen)

**Conséquences** :
- Acquisition plus lente au démarrage (besoin de volume pour convertir)
- Support client plus élevé (base utilisateurs free importante)
- Coûts variables proportionnels aux utilisateurs gratuits

**Statut** : ✅ Validée

**Ressources** :
- [docs/06-freemium-strategy.md](./docs/06-freemium-strategy.md)

---

## 2025-11-03 - Import IA Hybride (3 Stratégies)

**Contexte** : Import de recettes depuis le web peu fiable avec approche JSON-LD uniquement

**Décision** : **Approche hybride avec 3 stratégies en cascade** :
1. **Stratégie 1** : JSON-LD extraction (gratuit, rapide)
2. **Stratégie 2** : LLM + HTML scraping (Claude 3.5 Sonnet)
3. **Stratégie 3** : Vision AI screenshot (Claude Vision)

**Raisons** :
- ✅ **95%+ taux de succès** (vs 70% avec JSON-LD seul)
- ✅ Fonctionne sur **n'importe quel site** (pas seulement les gros sites avec JSON-LD)
- ✅ Coût maîtrisé : ~**$0.01-0.03** par import (JSON-LD gratuit capte 70%)
- ✅ Fallbacks intelligents : si JSON-LD échoue → LLM → Vision AI
- ✅ Extraction complète : ingrédients, étapes, temps, portions, images, tags
- ✅ Qualité constante grâce à validation Zod

**Alternatives considérées** :
- **Scraping pur (Cheerio)** : Fragile, nécessite patterns par site, maintenance lourde
- **IA uniquement** : Coûteux ($0.10+ par import), overkill pour sites avec JSON-LD
- **OCR Google Vision** : Moins précis que Claude Vision, coût similaire

**Architecture** :
```typescript
async function importRecipeFromURL(url: string) {
  // Stratégie 1: JSON-LD (70% succès)
  const jsonLD = await extractJSONLD(url);
  if (isValid(jsonLD)) return jsonLD;

  // Stratégie 2: LLM + HTML (20% succès)
  const html = await fetchHTML(url);
  const llmResult = await claudeParseHTML(html);
  if (isValid(llmResult)) return llmResult;

  // Stratégie 3: Vision AI (5% succès)
  const screenshot = await captureScreenshot(url);
  const visionResult = await claudeVision(screenshot);
  return visionResult;
}
```

**Coûts par stratégie** :
- JSON-LD : €0 (gratuit)
- LLM + HTML : ~€0.01 (4K tokens input)
- Vision AI : ~€0.03 (1 image 1920x1080)

**Conséquences** :
- Complexité technique accrue (3 stratégies à maintenir)
- Dépendance à Anthropic Claude (vendor lock-in)
- Coûts variables selon mix de stratégies utilisées
- Besoin de monitoring et analytics pour optimiser

**Statut** : ✅ Validée

**Ressources** :
- [docs/02-tech-stack.md](./docs/02-tech-stack.md#intelligence-artificielle)

---

## 2025-11-03 - React Native + Expo au lieu de Flutter

**Contexte** : Choix du framework mobile cross-platform

**Décision** : **React Native 0.76+ avec Expo 52+**

**Raisons** :
- ✅ Écosystème JavaScript/TypeScript (courbe d'apprentissage nulle)
- ✅ **Expo** simplifie drastiquement le développement mobile (OTA updates, EAS Build)
- ✅ Librairies tierces excellentes (NativeWind, React Query, Zustand)
- ✅ Hot reload ultra-rapide (Fast Refresh)
- ✅ Communauté massive, ressources abondantes
- ✅ Interopérabilité avec web si besoin futur (React Native Web)
- ✅ Performance native suffisante pour une app de contenu

**Alternatives considérées** :
- **Flutter** : Excellente performance mais Dart moins mainstream, moins de libs tierces
- **Native (Swift + Kotlin)** : Performance maximale mais 2x le travail, maintenance lourde
- **Ionic/Capacitor** : WebView moins performant, UX moins native

**Conséquences** :
- Dépendance à l'écosystème React Native
- Quelques compromis performance vs natif (mais négligeables pour notre use case)
- Updates Expo parfois breaking (mitigation : versioning strict)

**Statut** : ✅ Validée

---

## 2025-11-03 - Supabase au lieu de Firebase

**Contexte** : Choix de la plateforme Backend-as-a-Service

**Décision** : **Supabase** (PostgreSQL + Auth + Storage + Edge Functions)

**Raisons** :
- ✅ **PostgreSQL** relationnel (vs NoSQL Firebase) = meilleur pour notre modèle de données
- ✅ **SQL natif** = queries complexes faciles (joins, aggregations)
- ✅ **Drizzle ORM** compatible (Firebase nécessite SDK propriétaire)
- ✅ **Row Level Security** natif (sécurité au niveau DB)
- ✅ **Open-source** (auto-hébergeable si besoin futur)
- ✅ Pricing transparent et prévisible
- ✅ Edge Functions Deno (TypeScript natif, moderne)
- ✅ Realtime WebSocket natif
- ✅ Storage S3-compatible

**Alternatives considérées** :
- **Firebase** : NoSQL moins adapté, vendor lock-in Google, pricing imprévisible
- **AWS Amplify** : Trop complexe, overkill pour MVP
- **Custom Backend (NestJS + RDS)** : Maintenance lourde, coûts infra élevés

**Coûts Supabase** :
- **Free tier** : 500MB DB, 1GB storage, 2M Edge Functions executions
- **Pro tier** : €25/mois (suffisant jusqu'à ~10K users)

**Conséquences** :
- Vendor lock-in Supabase (mitigation : PostgreSQL standard = migration possible)
- Limites Edge Functions (10s timeout, 2MB payload)
- Besoin de compétences PostgreSQL

**Statut** : ✅ Validée

---

## 2025-11-07 - StyleSheet Natif + Design System au lieu de NativeWind

**Contexte** : NativeWind v4 instable avec Expo 54, problèmes de configuration et incompatibilités de versions pendant le setup initial.

**Décision** : **React Native StyleSheet natif** avec un Design System structuré (`src/theme/` + composants UI réutilisables)

**Raisons** :
- ✅ **Stabilité maximale** : Pas de problèmes de configuration ou breaking changes
- ✅ **Performance native** : StyleSheet compilé au build time, zéro overhead
- ✅ **Type-safety** : TypeScript fonctionne parfaitement avec StyleSheet
- ✅ **Production-ready** : Approche standard et éprouvée React Native
- ✅ **Debugging facile** : Moins de couches d'abstraction
- ✅ **Bundle size** : Aucune dépendance supplémentaire
- ✅ **Design System réutilisable** : `theme/` + composants UI = expérience similaire à Tailwind

**Alternatives considérées** :
- **NativeWind v4** : Problèmes d'incompatibilité avec Expo 54, configuration complexe
- **Styled Components** : Runtime overhead, bundle plus lourd
- **Tamagui** : Excellent mais trop opinionated, courbe d'apprentissage

**Architecture du Design System** :
```
src/
├── theme/
│   ├── colors.ts       # Palette Warm & Cozy
│   ├── spacing.ts      # Système d'espacement (4px base)
│   ├── typography.ts   # Tailles, poids, line heights
│   ├── shadows.ts      # Ombres pré-définies
│   └── index.ts        # Export centralisé
└── components/ui/
    ├── Text.tsx        # Composant Text avec variants
    ├── Button.tsx      # Composant Button réutilisable
    ├── Container.tsx   # Conteneur principal
    └── index.ts
```

**Exemple d'utilisation** :
```tsx
// ✅ Avec Design System (simple et propre)
import { Container, Text, Button } from "@/components/ui";
import { spacing } from "@/theme";

<Container centered>
  <Text variant="h1" color="primary">
    🍳 Paprika
  </Text>
  <Button variant="primary" size="lg" style={{ marginTop: spacing.xl }}>
    Commencer
  </Button>
</Container>
```

**Migration future** :
- Possible de passer à NativeWind v5 quand stable
- Ou rester avec StyleSheet (excellent pour MVP et production)

**Conséquences** :
- Plus verbeux pour styles complexes (mais composants UI compensent)
- Besoin de maintenir le Design System (mais structure claire)
- Meilleure stabilité = développement plus rapide

**Statut** : ✅ Validée

**Ressources** :
- [docs/09-design-system.md](./docs/09-design-system.md)
- Design System original : [docs/07-ui-guidelines.md](./docs/07-ui-guidelines.md)

---

## 2025-11-03 - Anthropic Claude au lieu d'OpenAI GPT

**Contexte** : Choix du LLM pour parsing recettes et nutrition

**Décision** : **Anthropic Claude 3.5 Sonnet** comme LLM principal

**Raisons** :
- ✅ **Context window** : 200K tokens (vs GPT-4o 128K) = meilleur pour HTML long
- ✅ **Vision AI** : Claude Vision excellent pour screenshots de recettes
- ✅ **Structured outputs** : JSON parsing fiable
- ✅ **Coût** : $3/M input tokens (vs GPT-4o $2.50 mais moins bon)
- ✅ **Latence** : ~2-3s pour parsing HTML (acceptable)
- ✅ **Safety** : Moins de refus injustifiés que GPT

**Alternatives considérées** :
- **OpenAI GPT-4o** : Excellent aussi mais context window plus court
- **Google Gemini** : Moins mature, API moins stable
- **Open-source (Llama 3)** : Coûts hosting > coûts API, maintenance lourde

**Coûts Claude 3.5 Sonnet** :
- Input : $3 / 1M tokens (~€0.003 / 1K tokens)
- Output : $15 / 1M tokens (~€0.015 / 1K tokens)
- Import HTML moyen : 4K tokens input + 1K output = **~€0.01**
- Vision AI : 1 image = **~€0.03**

**Conséquences** :
- Vendor lock-in Anthropic (mitigation : abstraction layer pour swap facile)
- Coûts proportionnels au volume d'imports
- Dépendance à l'uptime d'Anthropic

**Statut** : ✅ Validée

**Fallback** : Si coûts trop élevés, passer à GPT-4o mini ($0.15/1M) avec légère baisse de qualité

---

## 2025-11-03 - OpenFoodFacts au lieu de USDA FoodData Central

**Contexte** : Choix de l'API nutritionnelle pour calculs automatiques

**Décision** : **OpenFoodFacts** comme base nutritionnelle principale

**Raisons** :
- ✅ **Gratuit** : 0 coût, pas de limite d'API
- ✅ **2M+ produits** : Excellent coverage international
- ✅ **Focus France** : Produits français très bien couverts (notre marché principal)
- ✅ **Open-source** : Communauté active, data quality élevée
- ✅ **Multilingue** : Support FR, EN, ES, etc.
- ✅ **Nutri-Score** : Inclus dans les données
- ✅ **API simple** : REST, pas d'authentification

**Alternatives considérées** :
- **USDA FoodData Central** : Excellent pour USA mais faible coverage FR, API key requis
- **Edamam** : Payant ($70/mois pour 10K requests), overkill pour notre usage
- **Nutritionix** : Payant, focus USA
- **IA uniquement** : Coûteux ($0.005 par ingrédient), moins précis

**Architecture** :
```typescript
// 1. Cache lookup (Supabase)
const cached = await db.select()
  .from(nutritionCache)
  .where(eq(nutritionCache.ingredientName, 'tomate'));

if (cached) return cached;

// 2. OpenFoodFacts search
const nutrition = await openFoodFacts.search('tomate');

// 3. IA fallback si non trouvé
if (!nutrition) {
  nutrition = await claudeEstimateNutrition('tomate');
}

// 4. Cache permanent
await db.insert(nutritionCache).values({ ... });
```

**Coûts** :
- OpenFoodFacts : **€0** (gratuit)
- IA fallback : ~**€0.001** par ingrédient rare
- Cache Supabase : négligeable

**Conséquences** :
- Dépendance à OpenFoodFacts uptime (mitigation : cache agressif)
- Quelques ingrédients rares non trouvés (fallback IA)

**Statut** : ✅ Validée

---

## 2025-11-05 - Réorganisation Documentation

**Contexte** : Documentation éparpillée, difficile à naviguer pour Claude et développeurs

**Décision** : Refonte complète de l'architecture documentaire

**Changements** :
- ✅ Création `PROJECT-CONTEXT.md` (vue d'ensemble rapide)
- ✅ Création `docs/00-INDEX.md` (navigation par personas)
- ✅ Renommage `DOCUMENTATION/` → `docs/`
- ✅ Renommage `frontend-development-guidelines.md` → `08-frontend-guidelines.md`
- ✅ Suppression `DOCUMENTATION.md` (redondant)
- ✅ Ajout `DECISION-LOG.md` (ce fichier)
- ✅ Ajout `GLOSSARY.md` (termes métier)

**Raisons** :
- ✅ Meilleure discoverability (Claude trouve info en < 30s)
- ✅ Onboarding développeur plus rapide (parcours clairs par rôle)
- ✅ Maintenance simplifiée (structure logique)
- ✅ Traçabilité des décisions (DECISION-LOG.md)

**Conséquences** :
- Besoin de maintenir à jour les liens inter-documents
- Métadonnées à ajouter en haut de chaque doc

**Statut** : ✅ Validée

---

## Template pour Futures Décisions

```markdown
## YYYY-MM-DD - Titre de la Décision

**Contexte** :

**Décision** :

**Raisons** :
-
-

**Alternatives considérées** :
-

**Conséquences** :
-

**Statut** : ⏳ En discussion | ✅ Validée | 🔄 En révision | ❌ Annulée

**Ressources** :
-
```

---

**Maintenu par** : Équipe Paprika
**Dernière mise à jour** : 7 novembre 2025

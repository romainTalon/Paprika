# **Paprika - Stratégie Freemium & Paywalls**

*Guide complet d'implémentation - 31 octobre 2025*

---

## 🎯 **Philosophie : 0 Friction, Conversion Naturelle**

**Principe fondamental :** Pas de trial avec CB, pas de paywall dès l'arrivée. L'utilisateur découvre naturellement la valeur de Paprika et upgrade quand il en a besoin.

### **Pourquoi pas de Trial ?**

**Simulation A : Trial 7 jours avec CB** ❌
```
1000 visiteurs App Store/Play Store
↓ 95% partent (demande CB trop tôt)
50 inscriptions trial
↓ 40% convertissent après trial
20 utilisateurs premium × €4.99 = €99.80/mois
```

**Simulation B : Freemium Généreux** ✅
```
1000 visiteurs App Store/Play Store
↓ 50% téléchargent (pas de friction)
500 inscriptions gratuites
↓ 12% convertissent après usage
60 utilisateurs premium × €4.99 = €299.40/mois
```

**Résultat : Freemium = 3x plus de revenus** 💰

---

## 📊 **Limites Freemium**

### **Version Gratuite (Illimitée dans le temps)**

```yaml
Cookbooks: 2 maximum
Recettes: 20 maximum
Imports IA: 5 par mois (renouvellement auto le 1er)
Listes de courses: 1 active
Meal planning: ✅ Illimité (feature différenciante)
Calculs nutrition: ✅ Basiques
Export PDF: ❌
Sync multi-devices: ❌
Publicités: ✅ Discrètes (non-intrusives)
```

**Pourquoi ces limites ?**

1. **2 cookbooks** :
   - Suffisant pour comprendre l'organisation
   - Crée le désir d'avoir plus ("Desserts", "Été", "Quick meals")
   - Frustration légère qui pousse à l'upgrade

2. **20 recettes** :
   - ~2-3 semaines d'utilisation normale
   - Temps de s'attacher à l'app
   - Devient limitant après ~1 mois d'usage actif

3. **5 imports IA/mois** :
   - Assez pour tester la magie de l'IA
   - Coût maîtrisé : 5 × €0.01 = €0.05/user
   - Crée le besoin urgent quand épuisé
   - **Renouvellement mensuel** = récurrence d'upgrade opportunity

4. **Meal planning illimité** :
   - Feature différenciante vs concurrents
   - Crée engagement quotidien
   - Rend l'app indispensable
   - Ne coûte rien à fournir

### **Version Premium (€4.99/mois ou €49.99/an)**

```yaml
Cookbooks: ♾️ Illimité
Recettes: ♾️ Illimité
Imports IA: ♾️ Illimité
Listes de courses: ♾️ Illimité
Meal planning: ✅ Illimité
Calculs nutrition: ✅ Avancés
Export PDF: ✅ Professionnel
Sync multi-devices: ✅
Publicités: ❌ Aucune
Support: ✅ Prioritaire
```

**Économie annuelle :** €49.99/an = €4.16/mois (save 17%)

---

## 🎨 **UX des Paywalls "Warm & Cozy"**

### **Principe de Design**

✅ **À faire :**
- Ton amical, encourageant
- Féliciter l'utilisateur ("Bravo !", "Vous adorez...")
- Montrer les benefits visuellement (emojis, icônes)
- Toujours dismissable (bouton "Plus tard")
- Compteurs gamifiés (3/5 🌟)

❌ **À éviter :**
- Ton agressif ou urgent ("DERNIÈRE CHANCE!")
- FOMO manipulatif ("Ne ratez pas cette offre!")
- Blocage forcé (impossible de dismiss)
- Culpabilisation ("Vous ne voulez pas...")

### **3 Types de Paywalls**

#### **1. Paywall "Limite Atteinte"**

**Déclenchement :** Quand l'utilisateur atteint une limite

```typescript
// Exemple : 20 recettes atteintes
<PaywallModal
  type="limit_reached"
  title="Bravo ! 🎉"
  subtitle="Vous avez créé 20 recettes délicieuses"
  message="Votre bibliothèque culinaire grandit ! Passez Premium pour continuer sans limite."
  illustration="happy_chef.png"
  benefits={[
    { emoji: "♾️", text: "Recettes illimitées" },
    { emoji: "📚", text: "Cookbooks illimités" },
    { emoji: "🚀", text: "Imports IA illimités" },
    { emoji: "📄", text: "Export PDF" },
  ]}
  pricing={{
    monthly: "€4.99/mois",
    yearly: "€49.99/an",
    highlight: "Économisez 17%",
  }}
  cta={{
    primary: "Débloquer Premium",
    secondary: "Plus tard",
  }}
  dismissable={true}
/>
```

#### **2. Paywall "Import Épuisé"**

**Déclenchement :** Quand 5/5 imports utilisés

```typescript
<PaywallModal
  type="imports_exhausted"
  title="Vous adorez l'import IA ! 💫"
  subtitle="5/5 imports utilisés ce mois"
  message="L'import IA vous fait gagner un temps précieux. Passez Premium pour des imports illimités."
  
  // Compteur visuel
  counter={
    <View>
      <Progress value={5} max={5} color="orange" />
      <Text>Renouvellement dans 12 jours</Text>
    </View>
  }
  
  benefits={[
    { emoji: "♾️", text: "Imports illimités" },
    { emoji: "⚡", text: "Gain de temps quotidien" },
    { emoji: "🌐", text: "N'importe quel site" },
    { emoji: "🤖", text: "IA ultra précise" },
  ]}
  
  testimonial={{
    text: "J'importe 20+ recettes par mois, Premium est rentabilisé !",
    author: "Marie, utilisatrice Premium",
  }}
  
  cta={{
    primary: "Imports illimités",
    secondary: "Attendre le renouvellement",
  }}
/>
```

#### **3. Paywall "Découverte Premium"**

**Déclenchement :** J+7 pour utilisateur actif (3+ ouvertures/semaine)

```typescript
<PaywallModal
  type="discovery"
  title="Paprika vous plaît ? 😊"
  subtitle="Vous êtes avec nous depuis 7 jours"
  message="Profitez de toute la puissance de Paprika avec Premium."
  
  // Stats personnalisées
  stats={{
    recipesCreated: 8,
    mealsPlanned: 14,
    importsUsed: 3,
  }}
  
  benefits={[
    { emoji: "♾️", text: "Tout illimité" },
    { emoji: "📄", text: "Export PDF" },
    { emoji: "☁️", text: "Sync partout" },
    { emoji: "🎯", text: "Analytics nutrition" },
  ]}
  
  pricing={{
    monthly: "€4.99/mois",
    yearly: "€49.99/an",
    specialOffer: "€1.99 le premier mois", // Offre de lancement
  }}
  
  socialProof={[
    "⭐⭐⭐⭐⭐ 4.8/5 sur l'App Store",
    "💚 +10,000 utilisateurs Premium",
  ]}
  
  cta={{
    primary: "Essayer Premium",
    secondary: "Rester en version gratuite",
  }}
/>
```

---

## 🎮 **Compteurs & Gamification**

### **1. Badge Import Quota (Always Visible)**

```typescript
// components/ImportQuotaBadge.tsx
export function ImportQuotaBadge() {
  const { user } = useAuth();
  const { importsUsed, importsLimit } = useFreemium();
  
  if (user.isPremium) {
    return (
      <View className="bg-primary-500 rounded-full px-3 py-1">
        <Text className="text-white text-xs font-bold">
          ♾️ Premium
        </Text>
      </View>
    );
  }
  
  const percentage = (importsUsed / importsLimit) * 100;
  const isLow = percentage > 60;
  const isCritical = percentage === 100;
  
  return (
    <TouchableOpacity
      onPress={() => {
        if (isCritical) {
          showPaywall("imports_exhausted");
        }
      }}
      className="bg-white rounded-full px-4 py-2 shadow-sm"
    >
      <View className="flex-row items-center gap-2">
        <Text className="text-lg">
          {isCritical ? "🚨" : isLow ? "⚠️" : "🌟"}
        </Text>
        
        <View className="flex-1">
          <Text className="text-xs text-warm-gray">
            Imports IA ce mois
          </Text>
          
          <View className="flex-row items-center gap-2 mt-1">
            <Text
              className={`font-bold text-sm ${
                isCritical
                  ? "text-red-500"
                  : isLow
                  ? "text-orange-500"
                  : "text-primary-500"
              }`}
            >
              {importsUsed}/{importsLimit}
            </Text>
            
            <View className="flex-1 h-1.5 bg-cream-200 rounded-full overflow-hidden">
              <View
                className={`h-full ${
                  isCritical
                    ? "bg-red-500"
                    : isLow
                    ? "bg-orange-500"
                    : "bg-primary-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </View>
          </View>
          
          {isCritical && (
            <Text className="text-xs text-red-500 mt-1">
              Tapez pour débloquer 👆
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
```

### **2. Compteur Recettes (Dans l'onglet Cookbooks)**

```typescript
export function RecipesCountBadge() {
  const { recipesCount, recipesLimit } = useFreemium();
  const { user } = useAuth();
  
  if (user.isPremium) return null;
  
  const percentage = (recipesCount / recipesLimit) * 100;
  const isNearLimit = percentage > 80;
  
  return (
    <View
      className={`px-3 py-1 rounded-full ${
        isNearLimit ? "bg-orange-100" : "bg-cream-100"
      }`}
    >
      <Text
        className={`text-xs font-medium ${
          isNearLimit ? "text-orange-700" : "text-warm-gray"
        }`}
      >
        {recipesCount}/{recipesLimit} recettes
      </Text>
    </View>
  );
}
```

---

## 🎯 **Moments d'Upgrade Stratégiques**

### **Timeline Utilisateur Type**

```
Jour 0 : Téléchargement
  ↓ [Découverte libre, 0 friction]
  
Jour 1-3 : Phase découverte
  → Crée 3-5 recettes manuellement
  → Teste 1-2 imports IA (WOW effect)
  → Découvre meal planning
  Action : Aucun paywall, laisser explorer
  
Jour 4-7 : Phase engagement
  → Crée 8-12 recettes
  → Utilise 3-4 imports IA
  → Utilise meal planning régulièrement
  Action : Compteurs visibles, pas de paywall
  
Jour 7 : Premier paywall possible
  → Si utilisateur très actif (10+ recettes, 4+ imports)
  → Paywall "Découverte Premium" avec offre premier mois
  → Dismissable, non-intrusif
  
Jour 10-20 : Phase d'attachement
  → Atteint possiblement 20 recettes
  → Ou épuise 5 imports
  Action : Paywall contextuel "limite atteinte"
  
Jour 30+ : Utilisateur fidèle
  → Si toujours free mais actif
  → Paywalls occasionnels avec nouvelles offres
  → Highlights features premium (export PDF, etc.)
```

### **Triggers d'Upgrade**

```typescript
// services/paywall-triggers.ts

interface TriggerConditions {
  enabled: boolean;
  cooldown: number; // Minutes avant re-trigger
  maxShowsPerDay: number;
}

export const PAYWALL_TRIGGERS = {
  
  // Trigger 1 : Limite recettes atteinte
  recipes_limit: {
    enabled: true,
    cooldown: 1440, // 24h
    maxShowsPerDay: 1,
    condition: (user) => user.recipesCount >= 20 && !user.isPremium,
    priority: "high",
  },
  
  // Trigger 2 : Limite imports atteinte
  imports_limit: {
    enabled: true,
    cooldown: 720, // 12h
    maxShowsPerDay: 2,
    condition: (user) => user.importsThisMonth >= 5 && !user.isPremium,
    priority: "critical",
  },
  
  // Trigger 3 : Tentative import quand quota épuisé
  import_blocked: {
    enabled: true,
    cooldown: 0, // Immediate
    maxShowsPerDay: 5,
    condition: (user, action) => 
      action === "import" && 
      user.importsThisMonth >= 5 && 
      !user.isPremium,
    priority: "critical",
  },
  
  // Trigger 4 : J+7 utilisateur actif
  day_7_discovery: {
    enabled: true,
    cooldown: 10080, // 7 jours
    maxShowsPerDay: 1,
    condition: (user) => {
      const daysSinceSignup = getDaysSince(user.createdAt);
      const isActive = user.recipesCount >= 5 || user.importsThisMonth >= 3;
      return daysSinceSignup === 7 && isActive && !user.isPremium;
    },
    priority: "medium",
    specialOffer: "first_month_discount",
  },
  
  // Trigger 5 : Tentative export PDF (feature premium)
  pdf_export_attempt: {
    enabled: true,
    cooldown: 60, // 1h
    maxShowsPerDay: 3,
    condition: (user, action) => 
      action === "export_pdf" && !user.isPremium,
    priority: "high",
  },
  
  // Trigger 6 : Tentative 3ème cookbook
  cookbook_limit: {
    enabled: true,
    cooldown: 1440, // 24h
    maxShowsPerDay: 1,
    condition: (user, action) => 
      action === "create_cookbook" && 
      user.cookbooksCount >= 2 && 
      !user.isPremium,
    priority: "medium",
  },
};

// Gestion intelligente des triggers
export async function shouldShowPaywall(
  trigger: keyof typeof PAYWALL_TRIGGERS,
  user: User,
  action?: string
): Promise<boolean> {
  const config = PAYWALL_TRIGGERS[trigger];
  
  // Vérifier condition
  if (!config.condition(user, action)) return false;
  
  // Vérifier cooldown
  const lastShown = await getLastPaywallShown(user.id, trigger);
  if (lastShown && Date.now() - lastShown < config.cooldown * 60000) {
    return false;
  }
  
  // Vérifier max shows per day
  const showsToday = await getPaywallShowsToday(user.id, trigger);
  if (showsToday >= config.maxShowsPerDay) {
    return false;
  }
  
  return true;
}
```

---

## 💰 **Offres Promotionnelles**

### **1. Offre de Lancement (Premiers 1000 users)**

```typescript
const LAUNCH_OFFER = {
  code: "LAUNCH1000",
  discount: 60, // 60% off first month
  firstMonthPrice: 1.99,
  regularPrice: 4.99,
  message: "Rejoignez les 1000 premiers utilisateurs Premium !",
  badge: "Offre exclusive",
  expiresAt: "2025-12-31",
};

// Dans Stripe
await stripe.coupons.create({
  id: "LAUNCH1000",
  percent_off: 60,
  duration: "once",
  max_redemptions: 1000,
});
```

### **2. Offre Premier Mois (J+7)**

```typescript
const FIRST_MONTH_OFFER = {
  code: "FIRSTMONTH",
  discount: 60,
  firstMonthPrice: 1.99,
  message: "Essayez Premium pour seulement €1.99 le premier mois",
  validityDays: 3, // Expire après 3 jours
};
```

### **3. Black Friday / Périodes Clés**

```typescript
const SEASONAL_OFFERS = {
  black_friday: {
    discount: 20,
    yearlyPrice: 39.99,
    message: "Black Friday : 1 an de Premium à €39.99 !",
    period: "2025-11-24 to 2025-11-30",
  },
  
  new_year: {
    discount: 15,
    message: "Nouvelle année, nouvelles recettes !",
    period: "2025-12-26 to 2026-01-07",
  },
};
```

### **4. Parrainage**

```typescript
const REFERRAL_PROGRAM = {
  referrer: {
    reward: "1_month_free",
    message: "Parrainez un ami, obtenez 1 mois gratuit",
  },
  
  referred: {
    reward: "50_percent_off_first_month",
    firstMonthPrice: 2.49,
    message: "Votre ami vous offre 50% de réduction !",
  },
  
  // Backend logic
  async function applyReferralReward(referrerId: string, newUserId: string) {
    // Crédit 1 mois au parrain
    await extendPremium(referrerId, 30);
    
    // Coupon pour le filleul
    const coupon = await stripe.coupons.create({
      percent_off: 50,
      duration: "once",
    });
    
    await attachCouponToUser(newUserId, coupon.id);
  }
};
```

---

## 📊 **Analytics & Optimisation**

### **Métriques Clés à Tracker**

```typescript
// Paywall analytics
interface PaywallMetrics {
  // Impressions
  impressions: number;
  uniqueUsers: number;
  
  // Engagement
  dismissRate: number; // % qui dismiss
  convertRate: number; // % qui upgrade
  
  // Par type
  byTrigger: {
    [trigger: string]: {
      impressions: number;
      conversions: number;
      conversionRate: number;
    };
  };
  
  // Timing
  avgTimeToConversion: number; // Jours
  avgImpressionBeforeConversion: number;
}

// Tracking
async function trackPaywallEvent(
  event: "shown" | "dismissed" | "converted",
  trigger: string,
  userId: string
) {
  await analytics.track({
    event: `paywall_${event}`,
    properties: {
      trigger,
      userId,
      isPremium: false,
      daysSinceSignup: getDaysSince(user.createdAt),
      recipesCount: user.recipesCount,
      importsUsed: user.importsThisMonth,
    },
  });
}
```

### **A/B Tests Recommandés**

```yaml
Test 1 - Timing Premier Paywall:
  Variant A: J+7
  Variant B: J+14
  Métrique: Conversion rate
  
Test 2 - Offre Premier Mois:
  Variant A: €1.99 (-60%)
  Variant B: €2.99 (-40%)
  Métrique: Revenue total (conversions × prix)
  
Test 3 - Ton du Paywall:
  Variant A: "Bravo ! 🎉" (encourageant)
  Variant B: "Limite atteinte" (neutre)
  Métrique: Dismiss rate + conversion
  
Test 4 - Benefits Affichés:
  Variant A: 4 benefits principaux
  Variant B: 6 benefits détaillés
  Métrique: Conversion rate
```

---

## ✅ **Checklist d'Implémentation**

### **Backend**

- [ ] Schema DB : Compteurs freemium (recipes_count, imports_this_month, etc.)
- [ ] Trigger auto-reset imports (1er de chaque mois)
- [ ] Service freemium : `checkLimit()`, `incrementCount()`
- [ ] Webhook Stripe : Sync premium status
- [ ] Coupons Stripe : LAUNCH1000, FIRSTMONTH, etc.

### **Frontend**

- [ ] Hook `useFreemium()` : Compteurs + limites
- [ ] Composant `PaywallModal` : 3 variants (limite, découverte, feature)
- [ ] Composant `ImportQuotaBadge` : Always visible
- [ ] Composant `RecipesCountBadge` : Dans cookbooks
- [ ] Logic triggers : Quand montrer quel paywall
- [ ] Analytics tracking : Impressions + conversions

### **UX**

- [ ] Design "Warm & Cozy" : Amical, pas agressif
- [ ] Toujours dismissable
- [ ] Animations smooth (fade in/out)
- [ ] Haptic feedback sur upgrade success
- [ ] Confetti animation post-upgrade 🎉

### **Business**

- [ ] Offre lancement configurée
- [ ] Programme parrainage ready
- [ ] Dashboard analytics paywalls
- [ ] A/B tests setup (Posthog)

---

## 🎉 **Résultat Attendu**

**Avec cette stratégie freemium bien exécutée :**

- ✅ **Acquisition** : 10-20x plus de downloads vs trial
- ✅ **Engagement** : Users free deviennent ambassadeurs
- ✅ **Conversion** : 10-15% free → premium après 30j
- ✅ **Revenus** : 3x plus vs approche trial
- ✅ **Viralité** : Croissance organique par bouche-à-oreille
- ✅ **Feedback** : Grosse base pour itérer rapidement

**Break-even : 40-60 utilisateurs premium** (€4.99/mois)

---

*Guide Stratégie Freemium V1.0*
*Paprika - Conversion naturelle, pas de friction* 🚀

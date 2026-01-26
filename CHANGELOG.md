# Changelog

Toutes les modifications notables du projet Paprika seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [Unreleased]

### 📝 Documentation
- Ajout architecture complète de documentation
- Création `PROJECT-CONTEXT.md` pour vue d'ensemble rapide
- Création `docs/00-INDEX.md` avec navigation par personas
- Création `DECISION-LOG.md` pour traçabilité décisions
- Création `GLOSSARY.md` avec 50+ termes définis
- Refonte complète `README.md` avec badges et statut projet

### 🔧 Configuration
- Ajout `.gitignore` complet (secrets, builds, cache)
- Ajout `.gitattributes` pour normalisation fins de ligne
- Ajout `LICENSE` propriétaire
- Ajout `.env.example` template

### 📚 Structure
- Renommage `DOCUMENTATION/` → `docs/`
- Renommage `frontend-development-guidelines.md` → `08-frontend-guidelines.md`
- Organisation numérotée des documents (00-08)

### 🤖 IA & Import
- Import de recettes par photo avec Gemini Vision API (`gemini-2.0-flash`)
- Hook `usePhotoImport` pour capture caméra/galerie avec compression (1024px, JPEG 0.8)
- Modal `PhotoImportModal` pour sélection de la source photo
- Support de la stratégie d'import "photo" dans l'Edge Function
- Images d'ingrédients enrichies lors de l'export vers liste de courses (TheMealDB)

---

## [0.1.0] - 2025-11-05

### 🎉 Initial Setup
- Initialisation repository Git
- Création structure documentation de base
- Définition stack technique complète
- Définition modèle de données (7 tables PostgreSQL)
- Définition vision produit et stratégie freemium
- Définition roadmap 12 semaines
- Définition design system "Warm & Cozy"

---

## Format des Entrées

### Types de Changements
- **Added** (Ajouté) : Nouvelles fonctionnalités
- **Changed** (Modifié) : Modifications de fonctionnalités existantes
- **Deprecated** (Déprécié) : Fonctionnalités qui seront supprimées
- **Removed** (Supprimé) : Fonctionnalités supprimées
- **Fixed** (Corrigé) : Corrections de bugs
- **Security** (Sécurité) : Corrections de vulnérabilités

### Exemple d'Entrée

```markdown
## [1.0.0] - YYYY-MM-DD

### Added
- Nouvelle feature X (#123)
- Support de Y

### Fixed
- Correction bug Z (#456)

### Security
- Patch vulnérabilité CVE-XXXX
```

---

## Notes

- Les versions suivent [Semantic Versioning](https://semver.org/) : MAJOR.MINOR.PATCH
- Les dates utilisent le format ISO 8601 : YYYY-MM-DD
- Les numéros entre parenthèses (#123) sont des références aux issues/PRs GitHub

---

**Maintenu par** : Équipe Paprika
**Dernière mise à jour** : 5 novembre 2025

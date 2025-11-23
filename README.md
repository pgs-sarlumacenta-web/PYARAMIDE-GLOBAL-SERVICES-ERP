
# PGS-SARLU ERP - Système de Gestion Intégré

Bienvenue dans l'application de gestion intégrée pour PGS-SARLU. Ce système centralise les opérations de l'Académie, du Studio, de la Décoration, de la Boutique, du Wifizone et plus encore.

## 🚀 Démarrage Rapide

### Pré-requis
Assurez-vous d'avoir **Node.js** (version 18 ou supérieure) installé sur votre ordinateur.

### 1. Installation
Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
npm install
```

### 2. Lancement en Développement
Pour tester l'application en local :

```bash
npm run dev
```
L'application sera accessible sur `http://localhost:5173`.

### 3. Configuration de la Base de Données (Supabase) - ÉTAPE CRUCIALE
Pour que l'application fonctionne et sauvegarde les données, vous devez configurer la base de données :

1. Créez un compte gratuit sur [Supabase](https://supabase.com/).
2. Créez un nouveau projet.
3. Allez dans le menu **SQL Editor** (l'icône terminal à gauche).
4. Cliquez sur "New Query".
5. Ouvrez le fichier `supabase_schema.sql` qui se trouve à la racine de ce projet, copiez tout son contenu.
6. Collez le contenu dans l'éditeur SQL de Supabase et cliquez sur **RUN** en bas à droite.
   *Cela va créer toutes les tables nécessaires (users, clients, ventes, etc.).*

### 4. Connexion de l'Application à Supabase
Créez un fichier nommé `.env` à la racine du projet (là où se trouve `package.json`) et ajoutez vos clés Supabase :

```env
VITE_SUPABASE_URL=votre_url_supabase_trouvee_dans_settings_api
VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique_trouvee_dans_settings_api
```

## 📦 Déploiement sur Netlify

1. Créez un dépôt sur GitHub/GitLab et poussez ce code.
2. Connectez-vous à [Netlify](https://www.netlify.com/).
3. Cliquez sur "New site from Git".
4. Sélectionnez votre dépôt.
5. Netlify détectera automatiquement la configuration grâce au fichier `netlify.toml` inclus.
6. **Important** : Dans les paramètres du site sur Netlify ("Site configuration" > "Environment variables"), ajoutez les deux variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` avec les valeurs de votre projet Supabase.
7. Cliquez sur "Deploy".

## 🛠 Structure du Projet

- `/src/pages` : Les modules principaux (Studio, Shop, RH, etc.).
- `/src/components` : Composants réutilisables.
- `/src/context` : Gestion de l'état et de l'authentification.
- `/src/data` : Données de démonstration (utilisées si Supabase n'est pas connecté).

---
Développé pour PGS-SARLU.
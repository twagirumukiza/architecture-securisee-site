# Architecture sécurisée — BTS SIO 2

Site pédagogique statique : **① cours**, **② travaux pratiques** (Proxmox, pfSense, Kali), **③ quiz noté**, corrigé et téléchargements PDF/EPUB.
Aucune dépendance, aucun serveur : HTML/CSS/JS. La progression des étudiants est enregistrée dans leur navigateur (localStorage).

## Publier sur GitHub Pages
1. Créez un dépôt (par exemple `Architecture-securisee`) et poussez le contenu de ce dossier sur la branche `main`.
2. Dépôt → *Settings* → *Pages* → *Build and deployment* → Source : **GitHub Actions**.
3. Le workflow `.github/workflows/pages.yml` publie le dossier `site/`. Adresse : `https://<utilisateur>.github.io/<dépôt>/`.

## Réglages
- **Lien LinkedIn** : `site/assets/config.js` (variable `linkedin`).
- **Questions du quiz** : `site/assets/quiz-data.js` (une entrée par question ; `a` = index de la bonne réponse, ou tableau pour plusieurs réponses).
- **Contenu** : modifiez les fragments de `src/`, puis `python3 build.py` (régénère les pages) et `python3 gen_pdf.py` (régénère PDF et EPUB ; nécessite `playwright` + Chromium et `pandoc`).

© Twagirumukiza

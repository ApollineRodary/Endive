Ce répertoire contient les outils nécessaires pour "bundler" des modules de CodeMirror pour pouvoir les utiliser.

Pour initialiser ce répertoire : 
Il faut avoir installé `npm` et/ou node.js version >= 16 (attention à ne pas installer avec apt, ce n'est pas à jour) puis taper `npm install` 

Pour ajouter des fonctionnalités, il faut modifier `src/main.ts`.


Pour "bundler" il faut faire "npm run build", et puis déplacer le script dist/editor.js dans Interface/assets/scripts/editor.js

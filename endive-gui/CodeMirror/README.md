Ce répertoire contient les outils nécessaires pour "bundler" des modules de CodeMirror pour pouvoir les utiliser.

Pour initialiser ce répertoire : 
Il faut avoir installé `npm` et/ou node.js
et taper `npm install` 

Pour ajouter des fonctionnalités, il faut modifier `editor.mjs`.

Pour compiler un nouveau bundle, il faut installer RollUp, et exécuter :

`node_modules/.bin/rollup editor.mjs -f iife -o editor.bundle.js -p @rollup/plugin-node-resolve`

Cela génère notamment un fichier `editor.bundle.js` qu'il faut déplacer au bon endroit dans le dossier _Interface/assets/scripts_

Plus précisément :
- `node_modules` et package.json, qui permettent d'installer les packages nécessaire pour bundler une bibliothèque CodeMirror
- `editor.mjs` est le fichier de configuration du bundle CodeMirror, il permet d'installer des extensions et d'écrire du code qui sera lancé au démarrage de l'interface
- `rollup.config.mjs` est le fichier de configuration de RollUp, l'outil utilisé pour produire le Bundle
- `editor.bundle.js` est le fichier de bundle généré par RollUp, c'est la librairie JS que l'on importe dans l'index.html pour pouvoir utiliser CodeMirror

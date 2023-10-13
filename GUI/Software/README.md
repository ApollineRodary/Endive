Ce répertoire contient tous les fichiers relatifs à la production d'un exécutable déployable sur Linux, Mac ou Window. Pour faire ceci, on "wrap" la page html et toute ses dépendances dans une appli qui tourne avec Electron.

Pour tout faire fonctionner il faut faire 
`npm install` pour tout installer
`npm start` pour tester l'appli

Pour créer des exécutables :
`npm run make`

On y trouve :
- `node_modules` et `package.json` qui permettent d'installer rapidement les modules nécessaires à la construction de l'appli
- `index.js` est le fichier de création de l'application Electron. On y ouvre les fenêtres et tout, et on rend y définit des fonctions  permettant de gérer toutes les opérations qui sortent du cadre de la simple page HTML (enregistrement de fichier par exemple)
- `preload.js` est un fichier qui est exécuté avant l'affichage de la page, mais après son initialisation, ce qui permet de rendre disponible des fonctions javascript appellables depuis la page, mais pouvant par exemple exécuter les fonctions définies dans index.js

- `forge.config.js` est un fichier de configuration pour customiser la création d'exécutables
- Pour l'instant, le répertoire doit contenir une copie du dossier Interface. C'est un peu redondant (il faut le déplacer à chaque fois) ce serait cool de régler ça :)

Une fois tout installé, il suffit de faire "npm start" pour tester l'appli.

Known issues and things to think about :
- Faire qu'on ait pas besoin de déplacer le bundle et la page html à chaque fois
- Faire des fichiers de make pour pas avoir à retenir toutes les commandes
- Ajouter la possibilité de Sauvegarder (et pas juste "Save As")



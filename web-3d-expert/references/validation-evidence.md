# Validation de l'expertise WebGPU/TSL

État du 12 septembre 2026. Ce relevé distingue lecture, contrôle statique, évaluation de décisions et exécution GPU.

## Couverture de la formation

Les 21 leçons pédagogiques WebGPU/TSL ont été lues intégralement en texte par quatre agents, jusqu'à leur dernière section. Le [registre](course-coverage.json) réunit les 21 URLs et la couverture relevée. Quatre références en extraient les techniques, leurs contrats et leurs limites : fondamentaux, effets/post-traitement, particules/compute, simulations/environnements.

Aucune vidéo visionnée, aucun projet du cours téléchargé ou exécuté. Les textes bruts, assets et projets de la formation ne sont pas inclus dans le skill. Le cours Three.js de base conserve sa couverture partielle, détaillée dans [l'index](course-index.md).

## Laboratoire original exécuté

Le [laboratoire](../assets/tsl-lab/index.html) est un exemple indépendant : 257 sprites animés par un graphe TSL et un uniform modifiable, puis test d'âge persistant sur storage buffer. Dépendance figée : Three.js **0.186.0**, navigateur Chrome sur le poste local, origine loopback.

Résultats observés dans le navigateur :

| Test | Résultat |
| --- | --- |
| Rendu WebGPU | Couronne de sprites visible ; backend WebGPU affiché. |
| Uniform live | Amplitude 0 puis 1.2 : silhouette visiblement différente sans reconstruire le matériau. |
| Pause/reprise | Temps inchangé pendant pause ; reprise et retour au temps initial via reset observés. |
| Repli forcé WebGL2 | Même graphe de sprites rendu, backend WebGL2 affiché. |
| Accumulation compute, 257 éléments | Après trois pas de 0.25 s avec decay=0.4 : tous les âges ≈ 0.300000. |
| Saturation | Après vingt pas supplémentaires : tous les âges = 1.000000. |
| Reset deux fois | Tous les éléments reviennent à zéro. |
| Contrôle négatif | Un kernel qui remplace l'âge par l'incrément reste à 0.100000 : le test distingue la régression de la bonne accumulation. |
| Diagnostic backend | Aucun warning/error dans les logs consultés ; compteur d'erreurs backend nul sur le test. |

Le compute et ses readbacks ont été testés uniquement sur le backend WebGPU. Les readbacks sont limités au bouton de test, absents de la boucle d'animation. Ce laboratoire ne teste pas collisions entre voisins, neige, MRT, bloom ou performances mobiles. Aucun objectif de FPS global n'est revendiqué.

La vérification de syntaxe JavaScript passe. Le serveur fourni a été démarré et testé : page, module et dépendance servis, ressource absente en 404 et chemin sortant du répertoire en 403.

### Reproduire

Copier `assets/tsl-lab/` dans un répertoire de travail pour préserver le skill, puis :

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm start
```

Ouvrir `http://127.0.0.1:8768`, actionner les contrôles puis « Tester le compute ». Utiliser le lien « Repli WebGL2 » pour vérifier le rendu de ce backend. Si le port est pris, lancer avec `TSL_LAB_PORT=8769 npm start`. Le serveur écoute seulement sur loopback.

## Contrôles des références et des décisions

Un agent a recoupé dans le code installé r186 les signatures de `Fn`/layout, `toVarying`, `vertexStage`, `getShaderAsync` et la relation `grayscale`/`luminance`. La fiche a été corrigée pour ne pas confondre documentation du type et valeur retournée par l'implémentation. Le nom courant `RenderPipeline` est distingué de l'ancien `PostProcessing`.

Une évaluation séparée en lecture seule a utilisé la demande « ajouter une neige déformable à une application React existante, avec repli WebGL2 ». Le skill a permis de proposer inspection de la stack, capture orthographique des objets creusants, heightmap mise à jour par passe fragment avec RenderTargets ping-pong, normales cohérentes et intégration dans la boucle existante. Elle a identifié que les StorageTextures/compute ne constituent pas une garantie de repli. C'est une évaluation de décisions ; cette scène de neige n'a pas été construite ni testée.

Le validateur de skill et la vérification de ses références locales complètent ces contrôles. Ils ne prouvent pas que toutes les techniques des 21 leçons fonctionnent dans n'importe quel projet.

# Shaders et renderers

Consulter pour effets personnalisés, particules, GLSL, TSL ou migration de renderer.

## Contrat de compatibilité

Avant le code, noter renderer, version résolue de Three.js, système de matériaux, chaîne de post-traitement et backends à tester. Consulter la [documentation WebGPURenderer](https://threejs.org/docs/pages/WebGPURenderer.html). ShaderMaterial, RawShaderMaterial, onBeforeCompile et la chaîne EffectComposer WebGL demandent un portage. Le repli WebGL2 de WebGPURenderer ne rend pas automatiquement ces anciens matériaux compatibles.

Les anciennes versions emploient PostProcessing ; depuis r183, le nom est RenderPipeline. Le cours actuel est déjà actualisé. Vérifier la version résolue avant de reprendre une signature ; ne pas ajouter de renderAsync déprécié à un pipeline qui peut être initialisé puis rendu normalement. [RenderPipeline](https://threejs.org/docs/pages/RenderPipeline.html).

Pour WebGPU/TSL, utiliser les exports disponibles de three/webgpu et three/tsl dans la version installée. Attendre l'initialisation du renderer selon son API. Tester le backend natif puis le repli prévu ; les fonctionnalités de compute doivent être vérifiées séparément. Si la fonctionnalité essentielle n'existe pas sur un appareil cible, prévoir une variante plus simple ou une présentation HTML/statique explicite.

## Construire et déboguer un effet

Décrire le résultat recherché et ses paramètres artistiques avant la formule. Commencer par un matériau constant visible, puis afficher UV, normales ou masque pour vérifier les espaces. Ajouter déformation, couleur et transparence séparément. Observer erreurs de compilation et résultat visuel.

Dans la leçon [Shaders](https://threejs-journey.com/lessons/shaders), le début consulté établit la répartition vertex/fragment et les rôles des attributs, uniforms et varyings. Pour un calcul d'éclairage, positions, normales et direction de vue doivent employer des espaces compatibles. Déplacer un calcul au vertex est un compromis : vérifier que l'interpolation garde le détail attendu.

## GLSL

Utiliser ShaderMaterial lorsque ses déclarations injectées conviennent ; RawShaderMaterial demande de gérer explicitement les déclarations nécessaires. Adapter syntaxe, imports GLSL et chunks à la version du projet. Un patch onBeforeCompile est couplé au matériau et au renderer : isoler et vérifier les points d'insertion.

Pour une déformation, vérifier normales, ombres et limites de culling ; une géométrie déplacée sur GPU peut dépasser sa bounding box CPU. Pour les particules, mesurer fill rate, transparence et surdessin en plus du nombre de points. Ne pas supposer qu'une simulation GPGPU WebGL et un compute WebGPU partagent le même pipeline.

## TSL

L'[introduction WebGPU/TSL](https://threejs-journey.com/lessons/webgpu-tsl/introduction-to-webgpu-tsl) distingue le graphe TSL des langages générés pour les backends. Le graphe décrit du calcul GPU ; une variable JavaScript qui le référence n'est pas une valeur calculée sur le GPU.

La leçon [Node Materials](https://threejs-journey.com/lessons/webgpu-tsl/node-materials), désormais lue intégralement, donne notamment deux pièges concrets :

- Une propriété attendant un node reçoit un node typé, par exemple float(0), plutôt qu'un nombre JavaScript dont la coercition peut varier.
- Assigner une position constante à positionNode rassemble tous les sommets au même point. Pour un déplacement relatif, partir de la position locale et ajouter l'offset.

Réutiliser des sous-graphes compréhensibles. Distinguer construction du graphe, constantes et valeurs pilotées pendant l'exécution ; consulter la leçon Variables & References avant une mutation non triviale. Les shaders procéduraux restent coûteux : mesurer avant de multiplier les octaves de bruit ou les passes.

Pour les méthodes complètes, consulter [les fondamentaux TSL](tsl-fundamentals.md), [les effets](tsl-effects-postprocessing.md), [les particules](tsl-particles-compute.md) et [les simulations](tsl-simulation-environments.md) selon le besoin.

## Validation spécifique

Tester paramètres extrêmes, animation après pause, caméra proche/lointaine, arrière-plan clair/sombre et resize. Vérifier transparence/depth, silhouette, absence de NaN visuels, compilation et backend réellement utilisé. La présence de navigator.gpu ou un build réussi ne prouvent pas que l'effet s'affiche.

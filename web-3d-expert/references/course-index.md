# Three.js Journey : catalogue et provenance

Source : [Three.js Journey — Bruno Simon](https://threejs-journey.com/).
Relevé le 12 septembre 2026 depuis les liens visibles du programme et la session navigateur autorisée. 87 leçons pédagogiques répertoriées : 66 Three.js et 21 WebGPU/TSL. La navigation interne montre aussi deux pages de conclusion « The end », exclues de ce catalogue. Les nombres affichés peuvent donc différer selon la page.

## Ce qui a réellement été exploité

Les **21 leçons pédagogiques WebGPU/TSL ont été lues intégralement dans leur version texte**, puis synthétisées en quatre fiches spécialisées. Le [registre de couverture](course-coverage.json) contient leurs URLs, longueurs et dernières sections consultées. Il s'agit de 647 987 caractères de texte lu, pas d'un volume de contenu recopié dans le skill.

Pour le cours Three.js de base : Performance tips a été lue en entier et cinq autres leçons par extraits ; leurs statuts restent indiqués ci-dessous. Au total, 27 leçons ont été consultées et les 60 autres restent indexées seulement. Aucune vidéo visionnée ni projet du cours téléchargé ; aucun quiz répondu. Les correctifs et choix de production sont des synthèses originales, et leurs validations sont détaillées dans [les preuves](validation-evidence.md).

Les docs officielles complètent les décisions : [WebGPURenderer](https://threejs.org/docs/pages/WebGPURenderer.html), [Color Management](https://threejs.org/manual/en/color-management.html), [R3F performance](https://r3f.docs.pmnd.rs/advanced/pitfalls), [R3F hooks](https://r3f.docs.pmnd.rs/api/hooks). Les points techniques correspondants ont été recoupés le 12 septembre 2026 ; revalider les APIs mouvantes contre la version résolue du projet.

## Choisir les références selon le travail

| Besoin | Parcours conseillé |
| --- | --- |
| Première scène ou caméra | Three.js 03–11 ; 07 pour conteneur et resize. |
| Éclairage et rendu réaliste | 14–15 et 24–25. |
| Scroll et UI autour de la scène | 19, 22, 47–48 ; R3F 62 pour événements. |
| Modèles et baking | 21, 23, 49–52 ; R3F 59. |
| Architecture et React | 26, 53–59. |
| Shaders GLSL | 27–31, puis l'effet ciblé parmi 32–44. |
| Performance et post-traitement | 45–46 ; R3F 63 ; WebGPU 11. |
| Physique et jeu | 20 ou R3F 65–66 selon la stack. |
| WebGPU et TSL | Fondamentaux 01–08 avant le projet ciblé 09–21. |

Pour exploiter une leçon non lue, ouvrir son URL dans une session autorisée, lire la partie nécessaire et distinguer explicitement ce nouvel apport des connaissances générales. Ne pas charger les 87 leçons à chaque invocation. Si l'utilisateur demande un enrichissement du skill, ajouter une note originale avec URL, date et portion consultée ; ne pas changer les statuts simplement parce qu'un lien s'ouvre.

## Catalogue

Les libellés ci-dessous sont des clés de recherche dérivées des URLs, pas une transcription des titres ou du contenu.

### Three.js

| N° | Référence | Consultation au 12/09/2026 |
| --- | --- | --- |
| 01 | [introduction](https://threejs-journey.com/lessons/introduction) | Indexée uniquement |
| 02 | [what is webgl and why use three js](https://threejs-journey.com/lessons/what-is-webgl-and-why-use-three-js) | Indexée uniquement |
| 03 | [first threejs project](https://threejs-journey.com/lessons/first-threejs-project) | Indexée uniquement |
| 04 | [transform objects](https://threejs-journey.com/lessons/transform-objects) | Indexée uniquement |
| 05 | [animations](https://threejs-journey.com/lessons/animations) | Indexée uniquement |
| 06 | [cameras](https://threejs-journey.com/lessons/cameras) | Indexée uniquement |
| 07 | [fullscreen and resizing](https://threejs-journey.com/lessons/fullscreen-and-resizing) | Indexée uniquement |
| 08 | [geometries](https://threejs-journey.com/lessons/geometries) | Indexée uniquement |
| 09 | [debug ui](https://threejs-journey.com/lessons/debug-ui) | Indexée uniquement |
| 10 | [textures](https://threejs-journey.com/lessons/textures) | Indexée uniquement |
| 11 | [materials](https://threejs-journey.com/lessons/materials) | Indexée uniquement |
| 12 | [3d text](https://threejs-journey.com/lessons/3d-text) | Indexée uniquement |
| 13 | [go live](https://threejs-journey.com/lessons/go-live) | Indexée uniquement |
| 14 | [lights](https://threejs-journey.com/lessons/lights) | Indexée uniquement |
| 15 | [shadows](https://threejs-journey.com/lessons/shadows) | Indexée uniquement |
| 16 | [haunted house](https://threejs-journey.com/lessons/haunted-house) | Indexée uniquement |
| 17 | [particles](https://threejs-journey.com/lessons/particles) | Indexée uniquement |
| 18 | [galaxy generator](https://threejs-journey.com/lessons/galaxy-generator) | Indexée uniquement |
| 19 | [scroll based animation](https://threejs-journey.com/lessons/scroll-based-animation) | Indexée uniquement |
| 20 | [physics](https://threejs-journey.com/lessons/physics) | Indexée uniquement |
| 21 | [imported models](https://threejs-journey.com/lessons/imported-models) | Indexée uniquement |
| 22 | [raycaster and mouse events](https://threejs-journey.com/lessons/raycaster-and-mouse-events) | Indexée uniquement |
| 23 | [custom models with blender](https://threejs-journey.com/lessons/custom-models-with-blender) | Indexée uniquement |
| 24 | [environment map](https://threejs-journey.com/lessons/environment-map) | Indexée uniquement |
| 25 | [realistic render](https://threejs-journey.com/lessons/realistic-render) | Indexée uniquement |
| 26 | [code structuring for bigger projects](https://threejs-journey.com/lessons/code-structuring-for-bigger-projects) | Extrait initial consulté : introduction et début architecture ; suite non analysée |
| 27 | [shaders](https://threejs-journey.com/lessons/shaders) | Extrait initial consulté : concepts vertex/fragment et début setup |
| 28 | [shader patterns](https://threejs-journey.com/lessons/shader-patterns) | Indexée uniquement |
| 29 | [raging sea](https://threejs-journey.com/lessons/raging-sea) | Indexée uniquement |
| 30 | [animated galaxy](https://threejs-journey.com/lessons/animated-galaxy) | Indexée uniquement |
| 31 | [modified materials](https://threejs-journey.com/lessons/modified-materials) | Indexée uniquement |
| 32 | [coffee smoke shader](https://threejs-journey.com/lessons/coffee-smoke-shader) | Indexée uniquement |
| 33 | [hologram shader](https://threejs-journey.com/lessons/hologram-shader) | Indexée uniquement |
| 34 | [fireworks shaders](https://threejs-journey.com/lessons/fireworks-shaders) | Indexée uniquement |
| 35 | [lights shading shaders](https://threejs-journey.com/lessons/lights-shading-shaders) | Indexée uniquement |
| 36 | [raging sea shading shaders](https://threejs-journey.com/lessons/raging-sea-shading-shaders) | Indexée uniquement |
| 37 | [halftone shading shaders](https://threejs-journey.com/lessons/halftone-shading-shaders) | Indexée uniquement |
| 38 | [earth shaders](https://threejs-journey.com/lessons/earth-shaders) | Indexée uniquement |
| 39 | [particles cursor animation shader](https://threejs-journey.com/lessons/particles-cursor-animation-shader) | Indexée uniquement |
| 40 | [particles morphing shader](https://threejs-journey.com/lessons/particles-morphing-shader) | Indexée uniquement |
| 41 | [gpgpu flow field particles shaders](https://threejs-journey.com/lessons/gpgpu-flow-field-particles-shaders) | Indexée uniquement |
| 42 | [wobbly sphere shader](https://threejs-journey.com/lessons/wobbly-sphere-shader) | Indexée uniquement |
| 43 | [sliced model shader](https://threejs-journey.com/lessons/sliced-model-shader) | Indexée uniquement |
| 44 | [procedural terrain shader](https://threejs-journey.com/lessons/procedural-terrain-shader) | Indexée uniquement |
| 45 | [post processing](https://threejs-journey.com/lessons/post-processing) | Indexée uniquement |
| 46 | [performance tips](https://threejs-journey.com/lessons/performance-tips) | Texte intégral consulté |
| 47 | [intro and loading progress](https://threejs-journey.com/lessons/intro-and-loading-progress) | Indexée uniquement |
| 48 | [mixing html and webgl](https://threejs-journey.com/lessons/mixing-html-and-webgl) | Indexée uniquement |
| 49 | [creating a scene in blender](https://threejs-journey.com/lessons/creating-a-scene-in-blender) | Indexée uniquement |
| 50 | [baking and exporting the scene](https://threejs-journey.com/lessons/baking-and-exporting-the-scene) | Indexée uniquement |
| 51 | [importing and optimizing the scene](https://threejs-journey.com/lessons/importing-and-optimizing-the-scene) | Extrait consulté : import, baked, couleurs, noms et début optimisation |
| 52 | [adding details to the scene](https://threejs-journey.com/lessons/adding-details-to-the-scene) | Indexée uniquement |
| 53 | [what are react and react three fiber](https://threejs-journey.com/lessons/what-are-react-and-react-three-fiber) | Indexée uniquement |
| 54 | [first react application](https://threejs-journey.com/lessons/first-react-application) | Indexée uniquement |
| 55 | [first r3f application](https://threejs-journey.com/lessons/first-r3f-application) | Extrait initial consulté : setup, JSX, Canvas et début refactoring |
| 56 | [r3f drei](https://threejs-journey.com/lessons/r3f-drei) | Indexée uniquement |
| 57 | [debug a r3f application](https://threejs-journey.com/lessons/debug-a-r3f-application) | Indexée uniquement |
| 58 | [environment and staging with r3f](https://threejs-journey.com/lessons/environment-and-staging-with-r3f) | Indexée uniquement |
| 59 | [load models with r3f](https://threejs-journey.com/lessons/load-models-with-r3f) | Indexée uniquement |
| 60 | [3d text with r3f](https://threejs-journey.com/lessons/3d-text-with-r3f) | Indexée uniquement |
| 61 | [portal scene with r3f](https://threejs-journey.com/lessons/portal-scene-with-r3f) | Indexée uniquement |
| 62 | [mouse events with r3f](https://threejs-journey.com/lessons/mouse-events-with-r3f) | Extrait initial consulté : événements, informations et occlusion |
| 63 | [post processing with r3f](https://threejs-journey.com/lessons/post-processing-with-r3f) | Indexée uniquement |
| 64 | [fun and simple portfolio with r3f](https://threejs-journey.com/lessons/fun-and-simple-portfolio-with-r3f) | Indexée uniquement |
| 65 | [physics with r3f](https://threejs-journey.com/lessons/physics-with-r3f) | Indexée uniquement |
| 66 | [create a game with r3f](https://threejs-journey.com/lessons/create-a-game-with-r3f) | Indexée uniquement |

### WebGPU / TSL

| N° | Référence | Consultation au 12/09/2026 |
| --- | --- | --- |
| 01 | [introduction to webgpu tsl](https://threejs-journey.com/lessons/webgpu-tsl/introduction-to-webgpu-tsl) | Texte intégral lu et synthétisé |
| 02 | [node materials](https://threejs-journey.com/lessons/webgpu-tsl/node-materials) | Texte intégral lu et synthétisé |
| 03 | [variables and references](https://threejs-journey.com/lessons/webgpu-tsl/variables-and-references) | Texte intégral lu et synthétisé |
| 04 | [tools and debug](https://threejs-journey.com/lessons/webgpu-tsl/tools-and-debug) | Texte intégral lu et synthétisé |
| 05 | [math](https://threejs-journey.com/lessons/webgpu-tsl/math) | Texte intégral lu et synthétisé |
| 06 | [textures](https://threejs-journey.com/lessons/webgpu-tsl/textures) | Texte intégral lu et synthétisé |
| 07 | [uniforms and attributes](https://threejs-journey.com/lessons/webgpu-tsl/uniforms-and-attributes) | Texte intégral lu et synthétisé |
| 08 | [node functions](https://threejs-journey.com/lessons/webgpu-tsl/node-functions) | Texte intégral lu et synthétisé |
| 09 | [patterns](https://threejs-journey.com/lessons/webgpu-tsl/patterns) | Texte intégral lu et synthétisé |
| 10 | [coffee smoke](https://threejs-journey.com/lessons/webgpu-tsl/coffee-smoke) | Texte intégral lu et synthétisé |
| 11 | [post processing](https://threejs-journey.com/lessons/webgpu-tsl/post-processing) | Texte intégral lu et synthétisé |
| 12 | [shield](https://threejs-journey.com/lessons/webgpu-tsl/shield) | Texte intégral lu et synthétisé |
| 13 | [instances](https://threejs-journey.com/lessons/webgpu-tsl/instances) | Texte intégral lu et synthétisé |
| 14 | [magic explosions](https://threejs-journey.com/lessons/webgpu-tsl/magic-explosions) | Texte intégral lu et synthétisé |
| 15 | [sprites](https://threejs-journey.com/lessons/webgpu-tsl/sprites) | Texte intégral lu et synthétisé |
| 16 | [galaxy](https://threejs-journey.com/lessons/webgpu-tsl/galaxy) | Texte intégral lu et synthétisé |
| 17 | [anvil](https://threejs-journey.com/lessons/webgpu-tsl/anvil) | Texte intégral lu et synthétisé |
| 18 | [clair obscur title](https://threejs-journey.com/lessons/webgpu-tsl/clair-obscur-title) | Texte intégral lu et synthétisé |
| 19 | [sphere particles physics](https://threejs-journey.com/lessons/webgpu-tsl/sphere-particles-physics) | Texte intégral lu et synthétisé |
| 20 | [stylized nature scene](https://threejs-journey.com/lessons/webgpu-tsl/stylized-nature-scene) | Texte intégral lu et synthétisé |
| 21 | [snow](https://threejs-journey.com/lessons/webgpu-tsl/snow) | Texte intégral lu et synthétisé |


# WebGPU / TSL — décisions de conception et diagnostic

Lire pour démarrer ou migrer une scène TSL, choisir les données GPU, composer un matériau ou diagnostiquer un shader. Synthèse originale issue de la lecture complète des **textes des leçons 01–08** de Three.js Journey, le 12 septembre 2026. Aucune vidéo visionnée, aucun projet du cours téléchargé. Les patterns proposés ici sont originaux et doivent être compilés puis vérifiés avec la version résolue du projet ; cette lecture seule n'est pas une validation GPU.

Repères : renderer → matériau → espaces et données → calcul → texture → fonctions → diagnostic → recette.

## 1. Installer un pipeline cohérent

TSL décrit un graphe qui sera traduit en shader ; le JavaScript qui construit ce graphe ne s'exécute pas pour chaque fragment. Garder cette séparation présente pendant toute conception.

- Pour la voie étudiée dans le cours, importer les classes depuis `three/webgpu`, les nodes depuis `three/tsl` et les extensions compatibles depuis `three/addons`. Vérifier les imports générés automatiquement ; éviter d'embarquer involontairement deux voies de renderer.
- Initialiser le backend avant un rendu direct avec `await renderer.init()`, ou confier la boucle à `renderer.setAnimationLoop(callback)`. Ne pas maintenir simultanément une seconde boucle `requestAnimationFrame`.
- Vérifier le backend réellement actif. Le repli WebGL de `WebGPURenderer` ne garantit pas la présence des capacités WebGPU utilisées par l'effet, notamment le compute.
- Tester sur une origine sécurisée. Un serveur accessible sur le réseau local en HTTP n'a pas les mêmes conditions que `localhost`. Ne pas déduire la compatibilité mobile d'une réussite sur le poste de développement.
- Pour le temps CPU, le cours présente `Timer`, son `update()` et sa connexion à la visibilité du document. Pour une expression GPU dépendant simplement du temps, préférer les nodes fournis et leur sémantique vérifiée.

Source : [01 — Introduction to WebGPU and TSL](https://threejs-journey.com/lessons/webgpu-tsl/introduction-to-webgpu-tsl), lecture complète jusqu'à « Conclusion ».

## 2. Modifier le bon point du matériau

Commencer par la famille qui fournit déjà l'éclairage nécessaire : par exemple `MeshStandardNodeMaterial` pour PBR. Une couleur calculée ne justifie pas de réécrire tout le shader.

| Besoin | Point d'entrée et piège |
| --- | --- |
| Modifier l'albédo en conservant l'éclairage | `colorNode` ; si l'effet doit conserver couleur et map existantes, composer avec `materialColor`. |
| Piloter la rugosité | `roughnessNode`, avec un node typé, y compris `float(0)` ; un zéro JavaScript brut peut être traité comme une absence. |
| Déformer la géométrie | `positionNode` fournit une position, pas un décalage ; partir de la position appropriée puis ajouter l'offset. Une constante écrase tous les sommets au même point. |
| Fondu | `opacityNode` et paramètres de transparence du matériau ; vérifier l'ordre des surfaces et les ombres. |
| Montrer un signal sans éclairage | `outputNode` en `vec4` pour diagnostic ; son remplacement élimine le résultat d'éclairage antérieur. |
| Remplacer les sorties finales | `vertexNode` / `fragmentNode`, avec inspection du contrat installé ; réserver cette liberté au besoin réel. |

Un calcul envoyé à la couleur sera généralement payé par fragment. `vertexStage(expression)` ou `.toVarying()` permet d'évaluer en vertex puis interpoler. Comparer le gain au changement d'apparence : un bruit détaillé devient dépendant de la subdivision.

Source : [02 — Node Materials](https://threejs-journey.com/lessons/webgpu-tsl/node-materials), lecture complète jusqu'à « Importing TSL ».

## 3. Choisir l'espace et la propriété des données

Définir explicitement où un motif doit rester attaché : au maillage, au monde, à la caméra ou à l'écran.

| Signal | Utilisation |
| --- | --- |
| `positionGeometry` | Position géométrique avant displacement. |
| `positionLocal` | Position locale, displacement déjà pris en compte dans le pipeline décrit. |
| `positionWorld` | Motif fixé aux coordonnées du monde. |
| `normalLocal`, `normalWorld`, `normalView` | Normale dans l'espace requis ; aligner l'espace des deux opérandes avant un dot product. |
| `uv(index)` | Attribut UV choisi ; vérifier que l'asset possède ce jeu. |
| `screenUV`, `screenCoordinate` | Coordonnées écran normalisées ou pixels de rendu ; ces derniers dépendent du DPR. |
| `viewportUV`, `viewportCoordinate` | Coordonnées relatives au viewport utilisé. |
| `modelPosition` | Origine du mesh, différente de la position de chaque sommet. |

Un `vec3(new Vector3(...))` construit un node avec la valeur initiale ; il ne crée pas une liaison JavaScript vivante. Utiliser une uniform pour les changements futurs. Pour plusieurs meshes partageant un matériau mais nécessitant une valeur propre, examiner `userData('nom')` et le type réellement attendu.

Les références `materialColor`, `materialRoughness`, etc. permettent de prolonger le comportement natif. Réassigner aveuglément le node peut perdre une map préexistante.

Source : [03 — Variables & References](https://threejs-journey.com/lessons/webgpu-tsl/variables-and-references), lecture complète jusqu'à « Material references ».

## 4. Maîtriser les types, les domaines et le coût

- Employer les opérations TSL pour les valeurs GPU : `.add`, `.mul`, `.sub`, etc. `1 - unNode` est une opération JavaScript sur un objet, pas une soustraction shader.
- Rendre les conversions importantes explicites. Un entier à gauche d'une opération peut forcer la conversion de son autre opérande et perdre les fractions : convertir un indice avec `.toFloat()` avant de le multiplier par un espacement décimal.
- Documenter le domaine des signaux. `sin` oscille autour de zéro ; une opacité attend généralement une valeur bornée entre zéro et un. Utiliser remapping et clamp à l'endroit où leur sens est défini.
- Protéger les dénominateurs selon leur domaine. `max(x, EPSILON)` convient pour un dénominateur supposé positif ; ce n'est pas une correction universelle pour des valeurs signées.
- Choisir une graine stable. `hash` convient aux identifiants scalaires ; `rand` aux coordonnées 2D. Quantifier les coordonnées avant le hasard pour obtenir des cellules stables au lieu de variations par pixel.
- Les nodes `mx_noise_*` restent des calculs GPU. Choisir les dimensions d'entrée et de sortie utiles ; comparer une texture échantillonnée à un bruit procédural, puis comparer vertex et fragment.
- `time` et `deltaTime` représentent respectivement temps écoulé et intervalle depuis le rendu précédent. Pour une simulation, distinguer une position dérivée du temps d'un état intégré à chaque étape.

Source : [05 — Math](https://threejs-journey.com/lessons/webgpu-tsl/math), lecture complète jusqu'à « Procedural nodes ».

## 5. Échantillonner et traiter les textures intentionnellement

`texture(asset)` prend en charge les paramètres de texture usuels. En fournissant des UV explicites, on assume soi-même les transformations de coordonnées : ne pas supposer que `repeat` et `rotation` continuent à être appliqués automatiquement. Le wrapping et les filtres restent des paramètres distincts. Contrôler les mipmaps, la disponibilité du niveau demandé et l'espace de couleur de l'asset.

La projection triplanaire évite certaines mauvaises UV, avec trois échantillonnages puis un mélange dépendant de la normale. Garder position et normale dans le même espace : local pour que le motif accompagne le mesh, world pour un motif fixé au monde. Mesurer le surcoût sur les surfaces concernées.

Choisir le node de couleur selon l'intention : `mix` interpole, `hue` décale la teinte, `vibrance` agit différemment de la saturation uniforme. Ne pas confondre `saturation` avec `saturate`, qui borne entre zéro et un. `luminance` produit un scalaire ; ne pas supposer que `grayscale` a un type différent : en r186 son implémentation retourne directement `luminance(color.rgb)`, malgré un JSDoc indiquant `vec3`. Construire explicitement `vec3(luminance(signal.rgb))` quand un vecteur RGB est requis. `blendColor` attend les alphas et leur convention non prémultipliée ; préserver cette convention entre les étapes.

Source : [06 — Textures](https://threejs-journey.com/lessons/webgpu-tsl/textures), lecture complète jusqu'à « hue() ».

## 6. Injecter des données sans reconstruire le graphe

| Variation | Stockage initial à considérer |
| --- | --- |
| Valeur contrôlée par JavaScript, commune au draw | `uniform(...)`, puis modification de `.value` ou de ses composantes. |
| Petite palette ou liste uniforme | `uniformArray(...)` et `.element(index)` avec indice valide. |
| Valeur différente par sommet | `BufferAttribute`, récupéré par `attribute(name)` ou lié directement avec `bufferAttribute(buffer, type)`. |
| Valeur propre à chaque mesh partageant un matériau | Référence adaptée au mesh, par exemple `userData(...)`, après vérification du type. |

Les attributs sont lus au stade vertex ; leur passage vers fragment implique une interpolation. Vérifier le nombre d'éléments contre le nombre de sommets et le `itemSize` contre le type shader, avant d'accuser TSL.

Définir la taille d'une palette comme un contrat. Si sa longueur est capturée dans le graphe, modifier le tableau JavaScript n'actualise pas automatiquement cette constante ni les capacités du buffer. Changer des valeurs existantes et changer la structure sont deux opérations différentes.

Source : [07 — Uniforms & Attributes](https://threejs-journey.com/lessons/webgpu-tsl/uniforms-and-attributes), lecture complète jusqu'à « Attributes ».

## 7. Structurer le shader avec `Fn`

Utiliser `Fn` pour les expressions partagées et pour la logique GPU. Les valeurs par défaut doivent être des nodes si le corps appelle leurs méthodes. Les paramètres nommés conviennent aux fonctions avec plusieurs options.

- Un `if` JavaScript choisit comment construire le graphe ; un `If` TSL choisit un chemin dans le shader. Un `console.log` dans le callback n'observe pas l'exécution GPU.
- Utiliser `assign`, `addAssign`, etc. pour modifier une variable shader ; une réassignation de variable JavaScript ne produit pas cette instruction. Rendre une valeur mutable explicite avec `.toVar()` lorsque le contrat de la version l'exige ou que le graphe doit être inspecté.
- `Loop` construit une boucle GPU. Typer son compteur et borner son coût, particulièrement dans un fragment shader.
- Composer les masques avant inversion et discard. Un `Discard` à l'intérieur de chaque forme peut supprimer les fragments nécessaires aux autres formes.
- `Fn` ne garantit pas une fonction distincte dans le shader généré. Le cours fournit un layout typé en second argument pour obtenir cette forme ; cette signature est présente en r186 (`Fn(jsFunc, layout)` et layout compact `{ parametre: 'type', return: 'type' }`). Vérifier l'API pour une autre version. Tous les arguments requis doivent alors être fournis avec le bon type. Mesurer et inspecter au lieu de promettre un gain automatique.

Source : [08 — Node Functions](https://threejs-journey.com/lessons/webgpu-tsl/node-functions), lecture complète jusqu'à « Conclusion ».

### Pattern original : un masque rectangulaire pilotable

Exemple de composition, à vérifier dans le projet ; pas un extrait du cours. Il utilise des bornes croissantes de `smoothstep`, puis inverse le masque explicitement.

```js
import { MeshStandardNodeMaterial, Vector2 } from 'three/webgpu'
import { Fn, uniform, uv, smoothstep, materialColor } from 'three/tsl'

const halfExtent = uniform(new Vector2(0.23, 0.14))
const edgeSoftness = uniform(0.015) // imposer une valeur strictement positive
const boxMask = Fn(([coordinates, extent, softness]) => {
  const q = coordinates.sub(0.5).abs().sub(extent)
  return smoothstep(0, softness, q.x.max(q.y)).oneMinus()
})

const material = new MeshStandardNodeMaterial({ color: '#548dbd' })
const mask = boxMask(uv(), halfExtent, edgeSoftness)
material.colorNode = materialColor.mul(mask.mul(0.8).add(0.2))
// Plus tard : halfExtent.value.set(0.18, 0.3), sans recréer le matériau.
```

## 8. Diagnostiquer dans cet ordre

1. **Backend, imports, initialisation.** Confirmer l'exécution effective et l'absence d'erreurs JavaScript avant l'Inspector.
2. **Signal intermédiaire.** Afficher le masque ou les coordonnées via `outputNode`, en remappant les domaines signés si nécessaire. Une sortie blanche peut seulement être saturée par des coordonnées exprimées en pixels.
3. **Code compilé.** Utiliser `renderer.debug.getShaderAsync(scene, camera, mesh)` après initialisation, puis des noms `.toVar('nom')` pour retrouver les instructions. `.debug()` cible un node, à condition qu'il participe au rendu.
4. **Coût observé.** Examiner CPU/GPU, appels et mémoire avec l'Inspector si la version le fournit ; enregistrer quelques frames pour comprendre la séquence. Ne pas extrapoler un FPS affiché à une capacité sur tous les appareils.
5. **Repli.** Comparer avec `forceWebGL` lorsque la fonctionnalité doit le permettre. Un shader qui compile sur un backend n'est pas la preuve pour l'autre.

L'éditeur TSL et le transpiler officiels sont utiles pour isoler une expression ou amorcer une traduction GLSL, mais leur sortie se vérifie. L'Inspector décrit par le cours est évolutif ; la leçon cite notamment un comportement de `toInspector` en r185. Garder un affichage de diagnostic simple si l'outil ne montre rien, et vérifier que le node est effectivement utilisé.

Source : [04 — Tools & debug](https://threejs-journey.com/lessons/webgpu-tsl/tools-and-debug), lecture complète jusqu'à « Tweaker UI ».

Contrôle statique complémentaire sur les sources npm de **Three r186** : `toVarying` est bien enregistré comme méthode chaînée de `varying` (nom optionnel), `vertexStage` passe par `varying`, le second argument de `Fn` accepte le layout compact, et `debug.getShaderAsync(scene, camera, object)` renvoie `{ fragmentShader, vertexShader }` après compilation asynchrone. Sources inspectées : `src/nodes/core/VaryingNode.js`, `src/nodes/tsl/TSLCore.js`, `src/renderers/common/Renderer.js` et `src/nodes/display/ColorAdjustment.js`. Ce contrôle de signatures ne démontre pas le rendu du pattern ci-dessus.

## Recette ciblée avant livraison

- **Pipeline :** première frame sans erreur, backend annoncé, resize et DPR, arrêt/reprise de visibilité, repli requis réellement essayé.
- **Matériau :** zéro et valeurs intermédiaires d'un paramètre ; conservation de la map et de l'éclairage quand prévue ; matériau partagé par deux meshes avec valeurs distinctes.
- **Espace :** translation, rotation et échelle du mesh ; déplacement de la caméra ; vérifier que le motif reste attaché à l'espace choisi.
- **Données :** modification d'une uniform après le premier rendu, indices aux extrémités d'une palette, cardinalité et interpolation des attributs.
- **Fonctions :** branches activée/désactivée, compteur nul et nominal, décimales dans le calcul d'un indice, union de masques avant discard.
- **Texture et coût :** UV personnalisées, wrapping, minification, comparaison vertex/fragment à image comparable ; mesurer une scène réelle après échauffement.

Les cas ci-dessus sont des critères de recette proposés pour les prochains projets, pas des tests déjà exécutés pendant la création du skill.

# TSL : simulations persistantes et environnements

Consulter pour particules avec mémoire, collisions GPU, terrain et végétation, eau en espace écran ou traces dans une surface. Synthèse originale des textes complets des leçons WebGPU/TSL 18–21, lus le 12 septembre 2026. Les améliorations de production sont distinguées des choix pédagogiques. Aucune vidéo visionnée, aucun projet du cours téléchargé ou exécuté pour cette fiche.

## Choisir le flux de données

| Effet | Données | Calcul | Sortie |
| --- | --- | --- | --- |
| Pétales interactifs — 18 | Position initiale, position courante, progression, variation par instance ; émetteur en uniform | Initialisation puis mise à jour GPU avant rendu | Géométrie courbe instanciée, position et normale tournées ensemble |
| Sphères en collision — 19 | Positions, vitesses, chaleur ; rayon et forces en uniforms | Interactions entre éléments puis intégration | Instances éclairées et émission pilotée par la chaleur |
| Nature stylisée — 20 | Texture de couleur, hauteur et masque de végétation ; positions fixes des brins | Normales du terrain précalculées ; vent au vertex ; eau au fragment | Terrain, herbe et mélange avec le rendu déjà disponible |
| Traces dans la neige — 21 | Profondeur des objets vue du dessous ; champ de hauteur persistant | Capture de profondeur → modification du champ → rendu | Déplacement du sol et normales recalculées |

Choisir le stockage selon la durée de vie : attribut pour une variation fixe, uniform pour une commande commune modifiable, storage buffer/texture pour un état calculé qui persiste. Un effet purement fonction du temps et de l'index ne nécessite pas automatiquement un compute par frame. Prévoir qui initialise, qui écrit, qui lit et qui réinitialise chaque ressource.

## 18 — Pétales : émetteur, cycle de vie et ombrage

Source : [Clair Obscur Title](https://threejs-journey.com/lessons/webgpu-tsl/clair-obscur-title), du début à la conclusion 01:13:24.

- Employer des meshes instanciés quand l'objet doit montrer sa courbure et tourner librement ; un sprite qui fait face à la caméra répond à une autre intention visuelle. Centrer la petite géométrie avant les rotations ; choisir ses subdivisions selon sa silhouette.
- Séparer direction initiale, rayon d'émission et position de l'émetteur. Une direction stockée une fois reste réutilisable quand le rayon change. Appliquer rayon et émetteur à l'initialisation et à chaque renaissance, plutôt que figer ces commandes dans le premier compute.
- Initialiser aussi la position courante : un buffer à zéro peut autrement montrer toutes les instances au centre jusqu'à la première renaissance. Décaler les progressions initiales et les graines de variation pour éviter des naissances synchronisées ou des corrélations entre position et durée de vie.
- Exécuter l'initialisation après `await renderer.init()`, puis la simulation avant le rendu. Conserver la fraction dépassant la fin du cycle pour éviter un glissement systématique de sa fréquence. Pour un long arrêt, définir explicitement si la simulation reprend calmement ou rattrape le temps écoulé.
- Transformer la progression en enveloppe d'échelle : croissance brève, maintien, disparition. Une disparition par échelle convient à un objet opaque découpé et évite d'ajouter de la transparence uniquement pour son cycle de vie.
- Pour un motif alpha découpé, comparer `alphaTest` avec le blending. Le découpage évite que la partie vide du rectangle occulte les autres instances ; contrôler les ombres et les bords à petite taille. Le seuil du cours est un réglage artistique, pas une constante universelle.
- La couleur commune à toute une instance peut être calculée au vertex. Conserver les couleurs extrêmes en uniforms et seulement le coefficient aléatoire par instance permet de les modifier sans régénérer un buffer de couleurs.
- Tourner `normalLocal` avec la même rotation rigide que `positionLocal`. Modifier seulement la position laisse l'éclairage accroché à l'orientation initiale. Le cas d'une déformation non rigide demande un vrai recalcul de normale.

Le cours utilise un bruit 3D animé pour le vent et cite le bruit en texture comme alternative à mesurer. La rotation dérivée de la position est un artifice de mouvement, pas une simulation d'orientation physique. Son incrément de vent est exprimé par frame : pour une version sensible au framerate, définir une vitesse en unités/seconde et appliquer le pas temporel à son intégration.

Pour relier le pointeur à l'émetteur, convertir les coordonnées dans le rectangle du canvas puis intersecter un plan connu. Mettre à jour l'uniform après une intersection valide ; ignorer un rayon parallèle ou sans intersection. Le plan fixe du cours ne suffit pas si la caméra change librement d'orientation. Tester le déplacement de l'émetteur sans entraîner rétroactivement toutes les particules déjà émises.

## 19 — Collisions : récupérer les idées sans reprendre les courses aux écritures

Source : [Sphere Particles Physics](https://threejs-journey.com/lessons/webgpu-tsl/sphere-particles-physics), texte complet, conclusion 01:38:10. La leçon annonce une simulation visuellement crédible et non déterministe, puis reconnaît des écritures concurrentes en conclusion.

Les idées réutilisables sont la séparation position/vitesse/chaleur, la détection par distance comparée à la somme des rayons, la correction de pénétration, la projection de vitesse relative sur la normale de contact et la conversion d'un impact en émission temporaire. Calculer l'impulsion seulement pour un contact qui se rapproche ; un chevauchement déjà en séparation peut encore demander une correction de position sans nouvelle impulsion. Borner les divisions ; pour des centres exactement identiques, prévoir une direction de séparation de secours car diviser un vecteur nul par un epsilon reste nul.

### Architecture de production

Le code pédagogique parcourt les paires suivantes et modifie les deux éléments en place. Plusieurs invocations peuvent écrire le même élément et lire un état déjà partiellement modifié. **Ne pas transporter cette organisation dans un solveur présenté comme stable.**

Une organisation simple à contrôler consiste à lire un état précédent immuable et à réserver la sortie `i` à l'invocation `i`. Accumuler localement ses contributions, écrire une fois puis échanger les buffers après la passe. Pour des dépendances globales, séparer les passes. Une barrière de workgroup ne synchronise pas tout le dispatch ; les atomiques ne rendent pas un solveur déterministe par leur seule présence. La spécification précise aussi qu'une course aux données peut échapper aux diagnostics. [WGSL : modèle mémoire](https://www.w3.org/TR/WGSL/#memory-model), [synchronisation](https://www.w3.org/TR/WGSL/#sync-builtin-functions).

Une recherche de tous les voisins reste quadratique, même sur GPU et même si les paires sont dédupliquées. Mesurer ce coût séparément du rendu ; pour augmenter fortement l'effectif, étudier une grille spatiale ou un voisinage borné avant de réduire seulement la qualité du matériau. Les chiffres de particules du cours ne sont pas un budget appareil.

Définir les unités du solveur : vitesse en unités/seconde, accélération en unités/seconde². Employer le pas à la fois pour l'accélération et l'avancement de position. Pour des contacts sensibles, choisir un pas fixe avec rattrapage borné ; le simple clamp du delta évite l'explosion après pause mais ne garantit ni invariance au framerate ni déterminisme. Un amortissement exponentiel `exp(-lambda * dt)` évite une atténuation négative et facilite une commande en temps réel.

La chaleur doit rester positive et bornée selon le rendu ; elle peut décroître avec le temps puis multiplier une couleur émissive. Pour une interaction, distinguer déplacement du curseur par frame et vitesse par seconde. Réinitialiser la position précédente à l'entrée/pause pour éviter une impulsion artificielle. Un readback ciblé ou une file d'événements est possible si un son de collision est requis ; ne pas relire toutes les particules chaque frame et ne pas déclarer l'audio intrinsèquement impossible.

## 20 — Terrain et herbe : partager le même espace

Source : [Stylized Nature Scene](https://threejs-journey.com/lessons/webgpu-tsl/stylized-nature-scene), texte complet, conclusion 02:24:35.

Conserver une définition partagée du domaine du terrain, de son échelle verticale et de son orientation UV. La couleur est une texture de couleur ; hauteur et masque de végétation sont des données. Le cours place hauteur et masque dans deux canaux du même asset. Cette convention doit venir de l'asset, pas d'une supposition sur tous les fichiers.

Une displacement map modifie les sommets sans corriger automatiquement la normale. Pour un terrain statique, calculer la normale une fois depuis quatre échantillons de hauteur opposés puis stocker le résultat. Adapter les différences au pas réel dans le monde et à l'amplitude du relief ; ne pas figer la pente du cours quand la taille du terrain change. Définir le traitement des bords et la résolution de sortie. L'encodage en couleur transforme les composantes signées en plage positive ; le décodage doit correspondre à l'usage final, `normalMap` ou calcul personnalisé.

Les `StorageTexture` nécessitent le backend WebGPU. Pour le repli WebGL, le cours propose de produire la même carte avec un quad rendu dans un `RenderTarget` ; une carte préconstruite peut également convenir à un terrain immuable. Tester la variante avant de promettre le même parcours. [StorageTexture](https://threejs.org/docs/pages/StorageTexture.html)

Pour l'herbe, utiliser un petit triangle instancié et un attribut de position au sol. Une grille avec jitter limite les amas et trous ; le masque règle la présence/taille et la hauteur place la racine sur le terrain. Le domaine de végétation peut être plus petit que le terrain, mais son calcul UV doit continuer à utiliser le domaine du terrain. Les inversions d'axe se diagnostiquent en affichant les UV et le masque.

Le mouvement combine un vent lent cohérent et une oscillation plus rapide. Pondérer leur amplitude par la hauteur du sommet et la taille du brin pour garder les racines fixes et éviter d'étirer les petits brins. Le raccourci `vertexIndex` dépend de l'ordre des trois sommets ; ajouter des subdivisions impose de remplacer ce contrat, par exemple par un attribut de hauteur locale.

La leçon choisit délibérément les normales du terrain pour l'herbe, afin de fondre les jonctions et produire une apparence de lumière traversante. C'est un choix stylisé. Décoder ces normales, les orienter dans l'espace du terrain puis les convertir vers l'espace attendu par `normalNode`. Ne pas généraliser cet artifice à un matériau physiquement exact.

Déplacer couleur et normale communes du fragment vers le vertex peut réduire les échantillonnages. Faire s'effondrer les triangles trop petits évite des fragments, mais ne supprime pas leur travail vertex. Les bounds CPU doivent inclure champ, hauteur et déformation maximale ; le rayon horizontal seul du cours est insuffisant si les sommets peuvent dépasser verticalement. Le cas de positions géométriques à deux composantes exige des bounds explicites ou une géométrie à trois composantes pour les utilitaires CPU.

## 20 — Eau : ordre du rendu, profondeur et absorption

Le flux est : rendu opaque déjà disponible → échantillonnage du backdrop → estimation d'épaisseur → flou/absorption → masque de rivage. Vérifier d'abord la copie couleur sans effet ; si elle ne montre que le clear color, l'eau intervient trop tôt. `viewportSharedTexture` est lié à ce qui a été rendu, ce n'est pas une seconde caméra ni une garantie de voir tous les objets transparents.

Comparer `viewportLinearDepth` et `linearDepth()` dans la même convention puis convertir l'écart avec la plage near/far. L'écart mesure une séparation en profondeur de vue : ne pas le présenter comme la longueur physique exacte d'un rayon réfracté. Le borner à zéro évite qu'une profondeur de bord invalide inverse le signe de l'absorption et crée une amplification lumineuse. Tester MSAA, objets devant l'eau, ciel, bord de l'écran et changement de caméra.

L'absorption utilise une transmittance positive de forme `exp(-absorption * épaisseur)`. Des coefficients par canal donnent une teinte sans addition arbitraire de bleu. Le flou croît avec l'épaisseur ; exposer un maximum et mesurer son nombre d'échantillons. Le raccourci du cours remplaçant une très grande profondeur par une constante est spécifique à son décor : définir une politique explicite pour le fond sans géométrie.

Le rivage mélange la sortie du matériau et le backdrop à partir de la hauteur du terrain et d'un bruit animé. Partager le niveau d'eau entre position du mesh, masque et discard. La hauteur interpolée par le mesh peut différer de la texture haute résolution : vérifier les trous aux intersections au lieu de copier un offset de seuil arbitraire. Vérifier aussi le rendu vu du dessous si ce parcours est autorisé.

## 21 — Neige : capture, persistance et déformation

Source : [Snow](https://threejs-journey.com/lessons/webgpu-tsl/snow), texte complet, y compris « Read and write limitation » 01:25:01, réglages et conclusion 01:32:53.

### Séquence et invariants

1. Mettre à jour animations et objets interactifs.
2. Capturer les objets qui creusent avec une caméra orthographique sous le sol. Sa couverture correspond au champ ; une marge sous le niveau zéro évite de couper les objets qui pénètrent le sol.
3. Convertir la profondeur orthographique en hauteur du champ, bornée entre sol et épaisseur. Le niveau du sol et l'amplitude de la caméra doivent employer les mêmes paramètres.
4. Faire persister le minimum entre hauteur précédente et hauteur de l'objet, avec accumulation et diffusion optionnelles.
5. Rendre le sol déplacé depuis ce champ, avec normales cohérentes et détails de surface séparés.

Exclure le sol, les helpers et les visualisations de texture de la capture, de préférence par une sélection/layer dédiée. Ils ne doivent ni creuser le sol ni échantillonner la texture en cours d'écriture. Sauvegarder puis restaurer render target, états renderer et override material ; dans une application existante, restaurer la valeur précédente et pas systématiquement `null`. Garantir la restauration même si la passe échoue. Une matière de profondeur simplifiée doit encore préserver skinning, déformations vertex et découpage alpha utiles à la silhouette de l'objet.

La caméra du cours regarde la face inférieure des objets. Cela détermine quelle empreinte est capturée ; ce n'est ni une collision volumétrique générale ni une heightmap universelle. Tester les objets creux, les meshes ouverts et les déplacements rapides avant de retenir la technique.

### Mémoire de la neige

Le cours utilise un canal flottant et des accès storage en lecture/écriture. Consulter la version installée pour `storageTexture`, `load`/`store` et les modes d'accès ; les coordonnées de stockage sont des indices de texels, distincts des UV filtrées. [StorageTextureNode](https://threejs.org/docs/pages/StorageTextureNode.html)

**Adaptation de production :** pour le flou qui lit les voisins, utiliser deux textures : toutes les lectures proviennent de A et chaque invocation écrit son propre texel dans B, puis échanger. Un accès read/write supporté par le format ne garantit pas un snapshot entre invocations. Le blur en place du cours ne doit pas devenir une recette de simulation stable. Pour une opération strictement locale sans lecture des voisins, l'accès en place peut être approprié.

Schéma original du calcul d'un texel, exprimé en pseudocode plutôt qu'en API liée à une version :

```text
h = previous[cell]
average = moyenne(h et voisins de previous, avec indices bornés)
alpha = clamp(diffusion * dt, 0, 1)
candidate = mix(h, average, alpha) + snowfall * dt
next[cell] = clamp(min(candidate, contactHeight[cell]), 0, thickness)
```

Prévoir des bords explicites ; un décalage négatif sur un index non signé peut sortir du domaine. Initialiser et réinitialiser les deux textures à l'épaisseur réelle, pas à une constante de démonstration. Quand l'épaisseur change, choisir et appliquer la politique de conservation des traces, mettre à jour la caméra/projection et rendre les nouveaux paramètres cohérents avant la passe suivante. Un pas clampé ne suffit pas à borner un facteur de mix si la force reste arbitrairement grande.

La section de compatibilité du cours recommande `RedFormat` avec `FloatType` pour l'accès dans une même texture et cite des différences entre navigateurs pour les autres formats. Traiter cela comme un constat daté : vérifier format, accès, échantillonnage et backend sur les cibles. Le ping-pong résout l'organisation des dépendances, mais ne garantit pas à lui seul tous les formats WebGPU ni une compatibilité WebGL.

### Géométrie, normales et coût

Le mesh du cours est une plane tournée : son élévation reste sur Z dans son espace local. Conserver la position non déformée pour évaluer la hauteur des voisins. Appliquer la même fonction de hauteur au sommet et à ses voisins, puis calculer et normaliser leur produit vectoriel dans un ordre cohérent. Combiner ensuite le détail normal de la neige avec la normale géométrique déformée.

Résolution du champ et subdivisions sont deux budgets distincts. Doubler la résolution dans les deux axes quadruple texels et cellules ; mesurer capture, compute, rendu du sol et ombres. Les traces sont limitées à la zone couverte et au relief représentable ; le cours ne simule ni flocons ni dépôt sur chaque objet. Un mouvement trop rapide peut sauter des zones entre captures : préférer des sous-pas ou une empreinte balayée lorsque la continuité est un critère, plutôt que compter sur le flou pour la prouver.

## Vérifications ciblées à exécuter

- **Émetteur** : départ sans amas, rayon modifié en marche, arrêt/reprise, déplacement puis arrêt du pointeur ; normales et ombres suivent la rotation ; bounds valides au bord du champ.
- **Collisions** : deux corps de masses égales en collision frontale, contact oblique, centres identiques, trois contacts simultanés et corps déjà en séparation ; comparaison à plusieurs fréquences, reset complet et absence de valeurs non finies. Une capture jolie n'est pas une preuve de solveur.
- **Terrain/eau** : relief constant puis pente connue pour les normales, domaine de végétation réduit, soleil/caméra de l'autre côté, vitesse du vent nulle, profondeur nulle et grand fond, objets devant l'eau et changement near/far.
- **Neige** : empreinte immobile qui persiste après retrait, trajet continu lent/rapide, coins du champ, longue pause, reset répété, épaisseur zéro puis changement, sol/helper exclu du depth pass, frontières du ping-pong sans artefacts.
- **Compatibilité** : identifier le backend réel ; tester séparément le fallback de carte de normales et la politique prévue pour la neige. Aucun des exemples de cette fiche n'a été exécuté dans un navigateur lors de sa rédaction.

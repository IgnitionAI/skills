# TSL : motifs, effets, composition et instancing

Lire cette fiche pour un effet procédural, de la fumée, un impact, un effet d'apparition/disparition ou une chaîne de post-traitement WebGPU. Elle transforme six leçons en critères de conception réutilisables ; elle ne fournit pas les projets du cours.

## Choisir où calculer l'effet

| Besoin | Point d'intervention | Décision déterminante |
| --- | --- | --- |
| Motif, couleur, masque de surface | Nodes du matériau, fragment | Partir des UV ou d'une position dans un espace choisi. Séparer signal brut, masque et couleur. |
| Déformation d'une silhouette | `positionNode`, vertex | Prévoir la subdivision, les normales, les ombres et les bornes de visibilité. |
| Variation identique sur une instance | Donnée par instance, éventuellement calcul vertex | Éviter de recalculer une même valeur pour chaque fragment ; vérifier que l'interpolation conserve le résultat. |
| Teinte globale sans changement de coordonnées | Opération directe sur le node de sortie | Une opération de couleur n'exige pas à elle seule une texture intermédiaire. |
| Distorsion, flou ou recherche de voisins à l'écran | Texture du rendu précédent | Rendre l'entrée échantillonnable puis choisir explicitement ses coordonnées. |
| Contours de géométrie, masque sélectif | MRT avec les données nécessaires | Définir les sorties des matériaux concernés ; ne pas confondre contour d'une texture et contour d'un objet. |
| État animé persistant pour beaucoup d'instances | Storage et compute | Calculer avant le rendu, dimensionner les buffers et vérifier le backend cible. |

## Motifs : concevoir des signaux avant les couleurs

La leçon [09 — Patterns](https://threejs-journey.com/lessons/webgpu-tsl/patterns) sert à composer des opérations simples. Un masque fiable commence par une coordonnée et une plage connues : UV pour une texture attachée à l'objet, position pour un motif spatial, coordonnées d'écran pour un effet global. Fréquence, répétition, distance, seuil et palette sont des étapes distinctes.

- Pour une variation par cellule, quantifier les coordonnées avant de produire l'aléatoire. Un hash entier doit recevoir un identifiant scalaire stable ; un vecteur envoyé sans vérifier la conversion peut produire des bandes au lieu de cellules indépendantes.
- Un bruit signé ne constitue pas directement une opacité. Remapper et borner uniquement là où le contrat exige `[0,1]` ; conserver l'amplitude HDR pour l'émission.
- Composer les couches par masques successifs. Un masque doit avoir un sens stable : 1 conserve la couche, 0 la retire. Vérifier l'ordre des arguments de `step` lorsqu'on alterne syntaxe chaînée et autonome.
- La parallaxe des UV suggère de la profondeur sans déplacer la silhouette. Vérifier la dimension retournée par le node dans la version installée avant de composer un vecteur avec le temps ; ne pas convertir un correctif du cours en vérité universelle.

Diagnostic : afficher successivement coordonnée, identifiant, signal, masque et couleur. Neutraliser temporairement les transformations de couleur pour lire une donnée numérique ; une image tonemappée ne prouve pas sa plage exacte.

## Fumée : séparer déformation et couverture

La leçon [10 — Coffee Smoke](https://threejs-journey.com/lessons/webgpu-tsl/coffee-smoke) combine une surface subdivisée déformée et une opacité animée. Cette approximation convient à un effet local et léger si ses angles de vue restent convaincants ; elle ne produit pas un volume physique.

- Vérifier d'abord le mouvement en fil de fer. Construire une déformation cohérente à grande échelle puis une perturbation ; amortir le déplacement à la source pour éviter qu'elle dérive.
- Distinguer la référence modifiable `positionLocal` de l'attribut géométrique en lecture seule. Utiliser une variable GPU explicite issue de `.toVar()` lorsqu'une valeur calculée doit être modifiée dans un `Fn`.
- Traiter le motif de fumée et l'atténuation des bords séparément. La couverture finale doit rester finie et dans `[0,1]`, indépendamment des réglages de bruit.
- Comparer bruit calculé et texture de bruit répétable sur l'appareil visé. Un bruit vectoriel coûteux calculé par vertex et plusieurs bruits calculés par fragment n'ont pas le même budget.

Recette : tourner autour de l'effet, observer sa source, son sommet, sa tranche et les superpositions. Vérifier transparence et écriture de profondeur avec les objets voisins. Une animation réussie vue de face ne suffit pas.

## Post-traitement : construire un graphe de données explicite

La leçon [11 — Post-processing](https://threejs-journey.com/lessons/webgpu-tsl/post-processing) consultée utilise déjà `THREE.RenderPipeline`. Des exemples plus anciens utilisent `PostProcessing` : choisir les exports de la version résolue, sans mélanger la chaîne TSL et les passes `EffectComposer` WebGL.

- Départ : rendu de scène, effets dans leur espace de couleur attendu, conversion de sortie, éventuel antialiasing final. Pour FXAA, le cours place `renderOutput()` avant l'effet et désactive `outputColorTransform` automatique pour éviter une double conversion.
- Un effet qui reçoit `scene` et `camera` peut refaire le rendu lui-même. L'insérer après une chaîne existante peut donc remplacer les effets précédents. Vérifier son entrée réelle.
- Utiliser `convertToTexture()` lorsqu'il faut rééchantillonner l'entrée à d'autres coordonnées. Une multiplication de couleur n'en a pas besoin. Compter les cibles réellement ajoutées.
- Les MRT permettent de fournir des normales ou masques aux effets indépendamment de la couleur. Demander uniquement les sorties utiles, avec des valeurs adaptées pour les matériaux exclus.
- Pour une passe réutilisable, exposer une entrée et des paramètres stables ; normaliser les arguments en nodes. Une classe spécialisée n'est utile que si l'interface et le cycle de vie le justifient.

### Ordre, HDR et précision

Choisir explicitement si un halo doit inclure un effet ajouté : cet effet doit exister avant le bloom qui l'échantillonne. Conserver une branche de données indépendante pour les contours si des déformations de couleur ne doivent pas les modifier. Réutiliser les passes et mettre à jour leurs uniforms ; reconstruire le graphe uniquement quand sa structure change.

Un budget de pipeline doit intégrer les cibles MRT, leur format, la résolution, le multisampling et les passes plein écran. « Un seul dessin » ou « MRT » ne signifie pas gratuit. Mesurer le rendu complet avec ombres et transparence.

Les masques nets à l'intérieur d'un triangle peuvent aliaser même si les bords géométriques bénéficient du MSAA. Tester la scène en mouvement et à faible densité de pixels. Ne pas désactiver systématiquement MSAA parce qu'une démonstration compare FXAA : choisir selon le rendu et les mesures.

Une distorsion d'écran doit définir le traitement des UV hors domaine. Une coordonnée normalisée indépendamment sur X et Y étire un motif lors d'un changement de ratio ; une normalisation isotrope conserve ses proportions. Le point de référence de l'effet et son comportement au redimensionnement doivent être observables.

## Impacts et frontières : contrat d'espace avant l'effet

La leçon [12 — Shield](https://threejs-journey.com/lessons/webgpu-tsl/shield) montre un effet réutilisable alimenté par une texture de données, des impacts et un node de jonction appliqué à d'autres matériaux.

- Décrire les canaux d'une texture comme un schéma : distance, identifiant, masque, etc. Respecter leur interprétation de données, le filtrage et le wrapping ; ne pas leur appliquer une conversion sRGB réservée aux couleurs.
- Exposer l'objet visible et les paramètres utiles ; laisser au projet l'attachement à la scène, le chargement d'assets, le picking et l'interface de réglage.
- Stocker un impact dans l'espace de l'objet s'il doit le suivre. Le Fresnel exige deux directions exprimées dans le même espace ; pour une surface double face, définir le comportement arrière.
- Une jonction sphérique peut utiliser une distance signée. Définir le côté de la frontière et la largeur de la bande ; ajouter l'émission existante au lieu de l'écraser involontairement.

### Durcir le passage du cours au produit

Ces points sont des adaptations d'ingénierie aux hypothèses simplificatrices de la démonstration :

- Un rayon d'impact nul est un état normal lors de l'initialisation ou de la fin d'animation. Ignorer le slot inactif avant une division ou protéger le dénominateur ; ne pas compter sur `max(0)` pour supprimer un `NaN`.
- `worldToLocal()` modifie le vecteur reçu : convertir une copie si l'appelant conserve son point d'intersection.
- Le picking analytique doit correspondre à la forme visible. Pour une sphère sous des groupes transformés, transformer le rayon vers l'espace local ou calculer correctement centre et rayon mondiaux. Un scale non uniforme rend la forme mondiale ellipsoïdale ; une sphère mondiale approximative n'est plus un test exact.
- Si le rayon est appliqué seulement dans le shader, la géométrie CPU ne possède pas automatiquement les nouvelles bornes. Valider culling, picking et jonction après changement de rayon.
- Lors de la réutilisation d'un slot, annuler son animation précédente ou invalider ses callbacks. Deux animations ne doivent pas écrire simultanément dans le même impact.
- Pour un canvas intégré, calculer les NDC à partir de son rectangle DOM, pas des dimensions de la fenêtre. Séparer clic, glisser de caméra et glisser d'un gizmo.

## Instancing : choisir selon la propriété des données

La leçon [13 — Instances](https://threejs-journey.com/lessons/webgpu-tsl/instances) compare huit voies. Le choix utile dépend surtout de qui écrit les données et de leur fréquence de changement.

| Données et usage | Point de départ |
| --- | --- |
| Quelques objets indépendants | Meshes ordinaires partageant les ressources quand possible. |
| Transformations par instance gérées sur CPU | `InstancedMesh`, avant de réinventer les matrices. |
| Placement entièrement dérivable d'un indice | `Mesh.count` avec `instanceIndex`, si pris en charge par le renderer du projet. |
| Données spécifiques majoritairement statiques | `InstancedBufferAttribute`. |
| Petites séries réglées sur CPU | `uniformArray`, après vérification des limites et de l'alignement. |
| Animation avec état persistant sur GPU | Storage / `instancedArray` et compute. |

Intercaler les attributs n'apporte pas un gain universel : la fréquence de mise à jour et le backend peuvent rendre des buffers séparés préférables. Pour imposer l'ordre entre déformation et matrice d'instance, considérer un buffer de matrices et le node `instance()`.

### Invariants de transformation et de capacité

- Une rotation appliquée manuellement aux positions exige une transformation cohérente des normales ; une déformation non rigide peut exiger leur recalcul. Vérifier également le chemin des ombres.
- L'ordre déformation → rotation → translation produit un comportement différent de translation → déformation. Décider si l'effet suit chaque objet ou un champ commun.
- `instanceIndex` est entier. Convertir avant une division censée produire une progression fractionnaire.
- Gérer explicitement `count = 0` et `count = 1`. Une formule `index / (count - 1)` est indéfinie pour une seule instance. La progression choisie pour un singleton peut être 0 ou le centre, selon le placement voulu.
- `Mesh.count` modifie le nombre de dessins, pas la capacité du stockage. Borner le compte actif ou réallouer les buffers de façon cohérente avant de dépasser la capacité.
- Un nombre capturé lors de la construction du graphe ne suit pas automatiquement une mutation du compte au runtime ; utiliser un uniform lorsque le calcul doit suivre ce changement.
- Ne pas figer dans le skill les limites observées sur une machine. Inspecter la capacité du backend et le layout effectif, y compris le padding ; tester une petite allocation puis la capacité visée.
- Le stockage lu par le matériau doit avoir été initialisé avant son premier rendu. Vérifier le support des opérations compute réellement utilisées sur chaque backend annoncé.

## VFX temporaires : progression, masquage et durée de vie

La leçon [14 — Magic Explosions](https://threejs-journey.com/lessons/webgpu-tsl/magic-explosions) compose masquage, émission et déformation à partir d'une progression commune, puis réduit les instances dessinées à une fenêtre active.

- Exposer une progression normalisée et des paramètres artistiques séparés. Chaque sous-effet peut employer sa propre courbe tout en partageant la même durée de vie.
- `maskNode` décide si un fragment est conservé et attend un booléen. L'émission et la transparence ont des responsabilités différentes. Vérifier le masque aussi dans les ombres.
- Déplacer vers le vertex une couleur constante par instance peut réduire le travail fragment. Une information telle que `frontFacing` reste liée au fragment.
- Une fenêtre circulaire `début + compte` est appropriée si l'ordre d'expiration suit l'ordre d'émission. Les durées variables ou suppressions arbitraires demandent une liste active ou une table d'indirection.
- Une mise à plat des vertices contre un sol est une hypothèse géométrique : elle ne suit pas automatiquement un terrain ou un plan incliné.

### Pool robuste

Fixer la politique de saturation : ignorer une émission, remplacer l'instance la plus ancienne, ou augmenter la capacité. Lors d'un remplacement, invalider l'ancienne animation et empêcher sa fin de décrémenter une seconde fois le nombre actif. Capturer l'indice et une génération de slot dans les callbacks ; ne pas utiliser un curseur d'écriture mutable comme identité.

Garder `0 <= compteActif <= capacité`, des accès dans les buffers et des transitions de visibilité cohérentes. Lorsque le pool est vide, vérifier l'absence de dessin inutile avant d'utiliser `visible = false` ; rétablir la visibilité à l'émission suivante. Un simple compte zéro doit être mesuré dans la version réellement utilisée.

Les émissions continues doivent cesser au relâchement, à la perte de focus et à la destruction du composant. Retirer listeners, timers et animations lors du démontage. Donner une commande tactile et éviter que la touche d'émission capture la saisie dans un champ HTML.

## Recette ciblée avant livraison

| Scénario | Preuve attendue |
| --- | --- |
| Pipeline sans effets puis activation successive | Même cadrage, couleur de base cohérente ; chaque effet agit sur la branche prévue. |
| FXAA, bloom et conversion de sortie | Pas de double conversion, détail conservé et halo conforme à l'intention. |
| Portrait, paysage, DPR réduit et caméra mobile | Motifs proportionnés, bords contrôlés et pas de scintillement jugé seulement sur image fixe. |
| Impact absent, rayon nul, rayon maximal, impacts répétés | Valeurs finies, réaction au bon point, aucun callback périmé. |
| Objet dans un groupe transformé | Picking, impact local, jonction et silhouette alignés après déplacement et changement d'échelle. |
| 0, 1, capacité puis capacité + 1 instances demandées | Aucun accès hors limites ; politique de saturation visible et déterministe. |
| Pool plein puis réutilisation rapide | Aucune ancienne animation ne modifie une nouvelle instance ; compte stable. |
| Effet de nouveau vide puis relancé | Visibilité rétablie, nombre de dessins revenu au repos. |
| Navigation hors écran et retour | Bornes correctes malgré les positions générées sur GPU. |
| Fermeture/recréation de la scène, perte de focus | Pas de timers, contrôles, callbacks ni ressources possédées qui persistent. |

Les validations numériques ne prouvent pas la compilation WGSL/GLSL, le rendu GPU ni la compatibilité du repli WebGL. Pour les revendiquer, exécuter la scène sur les backends concernés et relever les erreurs ainsi que les mesures utiles.

## Provenance et limite

Texte rendu des six leçons ci-dessus lu intégralement le 12 septembre 2026 via la session autorisée, jusqu'à leur dernière section : `Conclusion` pour 09, 10, 11, 12 et 14 ; `When to use what?` pour 13. Vidéos non visionnées et projets non téléchargés. Les contrôles de robustesse et la recette sont une synthèse originale complémentaire ; les projets du cours et cette fiche n'ont pas été exécutés pour cette lecture.

# Assets et rendu

Consulter pour modèles glTF/GLB, textures, éclairage, baking et passage Blender → navigateur.

## Avant de modifier le rendu

Inspecter noms des nœuds, hiérarchie, dimensions, origine, matériaux, UV, textures et animations du modèle. Vérifier les chemins d'assets et décodeurs dans le build livré, pas seulement sur le serveur local. Garder les originaux et créer des dérivés pour les optimisations.

Pour une intervention dans Blender, utiliser une expertise Blender disponible si elle convient ; ce skill porte principalement sur l'intégration web. Ne pas annoncer une création d'asset 3D si seuls des matériaux ou un import ont été modifiés.

## Choisir baked, temps réel ou hybride

| Besoin | Choix à examiner |
| --- | --- |
| Décor fixe et éclairage immuable | Baking et matériau non éclairé pour conserver le rendu préparé. |
| Produit configurable ou éclairage variable | Matériaux PBR, environnement et éclairage réel mesurés. |
| Décor fixe avec éléments interactifs | Décor baked et objets dynamiques séparés. |

Une texture baked contenant déjà les ombres ne suit pas un déplacement de l'objet qui les a produites. Ne pas ajouter sans raison un second éclairage à un rendu intégralement baked. Conserver séparément les éléments animés, sélectionnables ou émissifs avant de fusionner des géométries.

Dans [Importing and optimizing the scene](https://threejs-journey.com/lessons/importing-and-optimizing-the-scene), les passages consultés montrent le choix d'un matériau non éclairé, la texture baked sRGB, le réglage flipY d'une texture externe pour le modèle glTF et le repérage des objets par nom. En production, vérifier le type Mesh avant de remplacer un matériau, et traiter explicitement les noms absents ou les hiérarchies imbriquées. Ne pas généraliser flipY=false à toutes les textures.

## Couleurs

Une texture de couleur PNG/JPEG (albedo, émission, rendu baked) doit être interprétée en sRGB ; les données de normales, rugosité ou métal utilisent généralement NoColorSpace. Les textures HDR linéaires suivent leur format et leur loader. Conserver les réglages corrects fournis par GLTFLoader plutôt que tout écraser.

Vérifier la conversion d'entrée, l'espace de travail linéaire, le tone mapping et la conversion de sortie. Une scène trop claire peut venir d'une double conversion, pas de l'intensité des lampes. Revalider après ajout du post-traitement. [Three.js : Color Management](https://threejs.org/manual/en/color-management.html).

## Réduire les coûts sans casser l'asset

La compression du fichier ne suffit pas à réduire la mémoire GPU : vérifier résolution et format décodé des textures. Choisir une résolution cohérente avec leur taille à l'écran. Tester le coût de décodage de Draco/Meshopt et le support KTX2/Basis avec les versions installées avant de les adopter.

Partager matériaux et géométries lorsqu'ils ont le même usage. Instancier les objets répétés si leur rendu et leurs interactions s'y prêtent. Une fusion peut réduire la finesse du culling ou supprimer des objets sélectionnables : mesurer le gain et préserver les besoins utilisateur.

Pour un rendu réaliste, régler d'abord cadrage, échelle, exposition, environnement et rugosité. Ajouter seulement les ombres et effets qui renforcent la lecture du sujet. Ne pas masquer un problème de matériau par une accumulation de bloom et de lumières.

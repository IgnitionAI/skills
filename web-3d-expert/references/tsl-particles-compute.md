# Sprites, particules et compute

Synthèse originale issue de la lecture intégrale du texte des leçons [15 Sprites](https://threejs-journey.com/lessons/webgpu-tsl/sprites), [16 Galaxy](https://threejs-journey.com/lessons/webgpu-tsl/galaxy) et [17 Anvil](https://threejs-journey.com/lessons/webgpu-tsl/anvil), le 12 septembre 2026. Les exemples ci-dessous sont indépendants des projets du cours.

## Choisir la représentation

Avec le backend WebGPU, ne pas reprendre automatiquement Points + taille variable du pipeline WebGL historique : les points natifs correspondent à des pixels unitaires. Pour des particules visibles et dimensionnables, employer des quads orientés vers la caméra, notamment Sprite + SpriteNodeMaterial avec count si la version installée le supporte. Vérifier ce comportement sur le backend réellement actif.

Dans SpriteNodeMaterial, positionNode décrit le centre de l'instance. scaleNode et rotationNode contrôlent son apparence dans le plan. Sur un matériau de mesh ordinaire, positionNode transforme les sommets : ce n'est pas le même contrat. Choisir des meshes instanciés pour des fragments volumétriques ou des ombres ; la voie Sprite du cours ne fournit pas ces ombres.

## Données minimales, calcul au bon endroit

| Donnée | Représentation utile | Coût et piège |
| --- | --- | --- |
| Identité d'une instance | instanceIndex | Convertir explicitement vers float pour la trigonométrie et garder les indices entiers pour les buffers. |
| Variation fixe par instance | Attribut instancié ou range | Chaque range crée un buffer ; réutiliser les nœuds lorsque la variation peut être partagée. |
| Aléatoire reproductible calculé | hash sur un seed entier | Même entrée = même sortie ; décorréler les canaux, ne pas assimiler cela à une RNG persistante. |
| Trajectoire analytique | Fonction de l'identité et du temps | Pas besoin de mémoire persistante pour une boucle déterministe. |
| Position/vitesse affectées par des collisions | Storage buffers + compute | Il faut initialisation, update, limites, durée de vie et ordre des passes. |

Une expression partagée entre positionNode et colorNode n'est pas nécessairement calculée une seule fois. Pour une valeur constante sur chaque sprite, la calculer au vertex et la transporter avec varying ou vertexStage/toVertexStage évite du travail par fragment. Ne pas faire cela à un masque UV qui doit conserver son détail par pixel.

## Trajectoires et masques transférables

Pour un système cyclique : définir un progrès borné p = fract(seed + vitesse × temps), puis dériver rayon, angle, taille et fade depuis ce même p. Le sens visuel se règle sur la grandeur dérivée (par exemple rayon décroissant), ce qui garde une convention temporelle stable.

Une distribution uniforme d'angle polaire concentre les points aux pôles. Pour une direction uniformément distribuée sur une sphère, tirer une hauteur z uniforme dans [-1,1] et un angle azimutal uniforme ; les deux autres coordonnées utilisent sqrt(max(0,1-z²)). Distinguer direction sur une surface et volume : un rayon uniforme n'est pas une densité uniforme dans une boule. Pour celle-ci, employer R × cbrt(u). Ce dernier choix est un complément mathématique, pas la distribution artistique du cours.

Dans le fragment d'un billboard : centrer les UV, calculer la distance au centre, puis construire disque, anneau ou texture alpha. Adapter l'anti-aliasing à la résolution ; un step dur peut scintiller sur de petites particules. Le fade doit aussi masquer le retour brusque d'une trajectoire cyclique.

Le mode additif fait disparaître le noir par addition, mais ne remplace pas une décision d'occlusion. La galaxie isolée du cours désactive depthTest : ne pas reporter ce réglage sur des étincelles qui doivent rester cachées derrière le décor. Le gain de draw calls ne supprime pas le coût du surdessin.

## Contrat d'une simulation persistante

1. Allouer une capacité bornée. positions et velocities peuvent être des vec3 ; age peut être un float ou un canal supplémentaire. Documenter leur espace et leurs unités.
2. Initialiser les données avant la première utilisation ; les particules inactives doivent être réellement invisibles, pas supposées cachées dans le modèle.
3. Construire un kernel d'émission qui ne modifie que les emplacements nouvellement attribués.
4. Construire un kernel d'évolution : vitesse depuis accélération × dt, position depuis vitesse × dt, contraintes/collisions, puis âge.
5. Initialiser le renderer, puis exécuter émission éventuelle → simulation → rendu. Ne pas lire les buffers sur CPU à chaque frame.
6. Prévoir pause/reprise, réinitialisation reproductible et libération des ressources possédées.

Pour des particules indépendantes, chaque invocation peut modifier son propre emplacement. Dès qu'un élément lit un voisin en train d'être modifié par un autre, une mise à jour in place n'est plus sûre : lire l'ancien état et écrire le nouvel état dans des buffers séparés, puis permuter. Voir [simulations et environnements](tsl-simulation-environments.md).

La leçon Anvil utilise instancedArray puis element(instanceIndex) et Fn(... )().compute(count). Vérifier les exports de la version résolue. Pour un count numérique, consulter ComputeNode sur les bornes générées ; un comptage logique ne doit jamais dépasser la capacité physique des buffers.

## Émissions successives sans tout réinitialiser

Un pool circulaire permet de conserver les particules précédentes : slot = (curseur + indiceLocal) % capacité. Avancer le curseur après émission. Borner la taille d'une émission à la capacité pour éviter que plusieurs invocations écrivent dans le même slot durant le même dispatch. Décider du comportement lorsque le pool est plein : remplacer les plus anciennes ou refuser l'émission, selon le besoin.

Pour une collision simple avec un plan, replacer d'abord une particule pénétrante à la hauteur de contact, puis corriger sa vitesse. Inverser uniquement la vitesse sans corriger la position peut la laisser osciller sous le plan. Ce modèle stylisé ne constitue pas une simulation physique complète.

## Coquille détectée dans le cours : accumulation de vie

Le texte d'Anvil demande d'augmenter la vie puis de la borner à 1, mais son dernier bloc de cette étape réaffecte la vie au seul incrément. Cela écrase l'état précédent. La correction doit conserver l'ancienne valeur :

```js
// Nœuds TSL ; age est une référence vers un élément de storage.
const nextAge = age.add(decay.mul(stepSeconds)).min(1);
age.assign(nextAge);
```

Test minimal : depuis 0, avec decay=0.4 et dt=0.25, trois updates donnent 0.1, 0.2, 0.3 ; le mauvais comportement reste à 0.1. Après assez d'updates la valeur doit rester à 1. Ne pas recopier une étape pédagogique sans vérifier l'invariant annoncé.

## Matériau de chaleur et paramètres artistiques

Préserver les propriétés du matériau glTF lorsqu'on le remplace par une classe NodeMaterial. Tester un masque via outputNode pour l'isoler, puis brancher le résultat final sur emissiveNode afin de conserver l'éclairage du matériau.

Un effet local peut combiner masque, distance dans le bon espace et intensité utilisateur. Borner les valeurs négatives avant une puissance : un carré rééclaire sinon des zones qui devaient être exclues. Une couleur HDR destinée au bloom n'impose pas une lumière physique correspondante ; ajouter celle-ci seulement si le décor doit réagir.

## Recette spécifique

- Paramètre live : modifier l'uniform, observer deux états ; pas de reconstruction du matériau à chaque frame.
- Lire une fois un buffer de test après updates, comparer à la valeur attendue et réinitialiser deux fois.
- Count non multiple de workgroup, curseur proche de la fin du pool et émission saturée.
- Aucun élément visible avant sa naissance ; disparition à la fin de vie et conservation des autres émissions.
- Objets devant/derrière, sortie du frustum et resize : valider culling, taille et occlusion des sprites.
- Backend natif et repli : qualifier séparément le rendu de sprites et le compute effectivement supporté.

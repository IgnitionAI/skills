# Runtime et interactions

Consulter pour structurer une expérience, gérer la caméra ou corriger une interaction.

## Architecture proportionnée

Séparer les responsabilités nécessaires : création/destruction de la scène, ressources, caméra, rendu, interactions et état métier. Une petite scène peut rester dans un module ; une grosse scène doit permettre d'identifier qui possède chaque ressource et qui l'actualise.

La leçon [Code structuring for bigger projects](https://threejs-journey.com/lessons/code-structuring-for-bigger-projects) présente une organisation personnelle : son introduction dit explicitement de l'adapter. Ne pas imposer son organisation par classes ou un singleton global à React, à plusieurs canvas ou à une application existante.

En Three.js natif, avoir un propriétaire clair de la boucle de rendu, du resize, des contrôles et du nettoyage. En R3F, laisser Canvas gérer le cycle normal ; éviter une seconde boucle requestAnimationFrame qui dessine la même scène.

## Animation et React

Les hooks R3F doivent s'exécuter dans un composant sous Canvas. Utiliser refs et useFrame pour les valeurs transitoires ; réserver l'état React aux transitions utiles à l'interface. Employer le delta en secondes pour une vitesse indépendante de la fréquence. Réutiliser les objets temporaires dans les chemins fréquents. [Docs R3F : hooks](https://r3f.docs.pmnd.rs/api/hooks), [performance](https://r3f.docs.pmnd.rs/advanced/pitfalls).

Pour la physique, respecter la politique de pas du moteur et borner le rattrapage après un onglet masqué. Pour une interpolation amortie indépendante du framerate, calculer le facteur à partir du delta plutôt qu'utiliser une constante par frame.

En mode rendu à la demande, vérifier les invalidations pour contrôles et animations ; ce mode ne rend pas une scène animée gratuitement. Un composant démonté ne doit plus garder sa propre boucle ni ses abonnements externes.

## Caméra et entrées

- Dimensionner à partir du conteneur réel du canvas, actualiser projection et renderer au resize. Éviter de verrouiller tout le body pour une simple section 3D intégrée à une page.
- Garder une hiérarchie visuelle stable. Borner les contrôles si nécessaire pour éviter de traverser le sol ou perdre le sujet ; fournir un retour au cadrage initial lorsque la navigation est libre.
- En picking natif, convertir les coordonnées du pointeur avec le rectangle du canvas, pas systématiquement la fenêtre. Choisir les objets interactifs et la règle d'occlusion.
- En R3F, un objet visible devant un autre ne suffit pas à bloquer les événements. Définir la propagation voulue, distinguer object et eventObject, puis vérifier objets superposés et groupes. Voir [Mouse Events](https://threejs-journey.com/lessons/mouse-events-with-r3f), passage consulté jusqu'à l'occlusion.
- Distinguer clic et déplacement de caméra ; gérer sortie, relâchement hors zone et pointercancel pour les glissements personnalisés. Ne pas faire dépendre une action essentielle du hover.
- Préserver le scroll mobile lorsque la 3D n'est qu'une partie de la page. Donner un équivalent HTML/clavier aux actions essentielles ; respecter la réduction des mouvements.

## Chargement et fin de vie

Afficher des états utiles pendant le chargement et après une erreur. Un pourcentage de fichiers chargés n'est pas forcément un pourcentage d'octets ni la preuve que le premier rendu est prêt. Prévoir l'échec d'un modèle, d'une texture ou d'un décodeur sans bloquer le reste de la page.

Annuler ou ignorer un résultat asynchrone devenu obsolète après démontage. Retirer listeners, contrôles, timers et abonnements. Libérer uniquement les géométries, textures, matériaux et render targets dont l'instance est propriétaire ; ne pas disposer un asset en cache encore partagé par d'autres objets. Tester plusieurs montages/démontages, notamment avec le cycle de développement React.

Ces critères de production complètent les passages du cours ; ils ne sont pas tous attribués à Bruno Simon.

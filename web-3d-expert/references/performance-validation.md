# Performance et recette

Consulter pour diagnostiquer une scène lente et avant de livrer une expérience.

## Mesurer avant d'optimiser

La leçon [Performance tips](https://threejs-journey.com/lessons/performance-tips), lue en texte, recommande de mesurer CPU/GPU, draw calls, ressources et coût des assets sur plusieurs appareils. En tirer des hypothèses testables, pas des règles absolues telles que « supprimer toutes les lumières » ou « aucune branche dans un shader ».

Fixer l'appareil, le navigateur, le viewport, le DPR et le parcours mesuré. Examiner chargement à froid, première interaction, mouvement soutenu et retour à la scène. Relever frame time et variations, draw calls/triangles lorsque le renderer l'expose, taille transférée et ressources actives. Les compteurs renderer ne représentent pas toute la VRAM. Éviter d'annoncer des performances mobiles depuis le seul ordinateur de développement.

## Hypothèse → expérience

| Symptôme | Expérience limitée | Piste si le résultat s'améliore |
| --- | --- | --- |
| Lenteur sensible à la taille du canvas | Baisser temporairement DPR ou résolution | Fill rate, transparence, shaders fragment, post-traitement. |
| Trop d'objets répétitifs | Comparer partage/instancing à scène équivalente | Réduire les draw calls sans perdre picking ou culling utile. |
| Saccades sur chaque mouvement | Profiler JavaScript et renders React | Réduire allocations, setState fréquent et calculs CPU. |
| Coût des ombres | Désactiver une lumière ou ombre à la fois | Réduire couverture/résolution/fréquence selon mobilité réelle. |
| Gel initial | Comparer téléchargement, décodage et compilation | Réduire assets critiques, simplifier shader, préparer ce qui est nécessaire. |
| Dégradation après navigation | Répéter entrée/sortie et comparer les ressources | Vérifier boucles, listeners et ownership des ressources. |

Commencer avec un DPR plafonné raisonnable (souvent 1 à 2), puis ajuster par mesure. Ne pas figer un nombre universel de triangles ou de draw calls. N'appliquer les anciennes contraintes « power of two » qu'après vérification du backend et du format ; ne pas les présenter comme une obligation générale de tous les renderers actuels.

Ne pas modifier les flags de sécurité du navigateur, couper la vsync ou installer une extension pour une mesure ordinaire. Utiliser d'abord les outils existants. Comparer avant/après sur le même parcours et vérifier que le gain n'a pas rendu l'action principale inutilisable.

## Recette proportionnée

- Build et vérifications du projet, puis ouverture du rendu réel : pas d'erreur nouvelle de compilation GPU, console ou ressource manquante.
- Cadrage initial et après resize ; sujet lisible et interface HTML accessible aux formats visés.
- Clic/tap, glissement, relâchement hors zone, retour au cadrage et occlusion conformes au comportement voulu.
- Chargement lent ou asset absent : état compréhensible et page toujours utilisable ; reprise si prévue.
- Réduction des mouvements et alternative clavier/HTML pour les actions essentielles.
- Entrée/sortie répétée de la scène : pas de multiplication des boucles ni de croissance continue inexpliquée des ressources.
- Si WebGPU : vérifier le backend actif et le repli promis, pas uniquement l'existence de l'API.

Sur une correction limitée, choisir les scénarios touchés plutôt que dérouler toute la liste. Pour un nouveau parcours interactif, capturer au moins le rendu initial et l'état après action ; ne pas appeler une capture seule un test d'interaction.

## Évaluation du skill lui-même

Ces scénarios servent à une future évaluation comportementale, et ne sont pas des tests déjà exécutés :

1. « Ajoute un configurateur à mon application React existante » : inspecte la stack, réutilise R3F si approprié, conserve le HTML, prévoit sélection et cycle de vie ; ne recrée pas une application autonome.
2. « Ma scène rame avec 8 000 objets identiques » : établit une mesure et compare instancing, DPR et coût de rendu ; ne promet pas un FPS sans mesure.
3. « Mon ShaderMaterial ne marche plus depuis WebGPU » : diagnostique la compatibilité avant de modifier les uniforms ; propose un portage TSL ou le renderer approprié au besoin.
4. « Mon objet derrière un autre reçoit le clic » : distingue picking et occlusion visuelle, corrige la propagation voulue, vérifie les deux objets.
5. « Utilise la leçon Snow » sans session accessible : utilise la synthèse locale issue de sa lecture complète, vérifie les APIs dans les docs et demande seulement un détail privé réellement indispensable ; n'invente ni lecture des vidéos ni tests du projet original.

Le validateur de skill contrôle la structure seulement. Pour établir l'efficacité réelle, exécuter un de ces cas sur un projet isolé et examiner code, rendu et interactions ; consigner ce qui a réellement été testé.

Les vérifications déjà effectuées sur le laboratoire TSL et l'évaluation de décisions sont consignées dans [les preuves de validation](validation-evidence.md). Les scénarios ci-dessus restent distincts de ces contrôles ciblés.

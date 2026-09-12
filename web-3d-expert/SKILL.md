---
name: web-3d-expert
description: "Concevoir, développer, déboguer et optimiser des expériences web 3D avec Three.js, React Three Fiber, GLSL ou WebGPU/TSL : scènes interactives, configurateurs, portfolios, particules et intégration glTF. Utiliser pour le rendu 3D temps réel dans le navigateur ; la modélisation Blender seule relève d'une expertise Blender. Références ciblées vers Three.js Journey de Bruno Simon."
---

# Expertise Web 3D

Produire une expérience utilisable, visuellement maîtrisée et mesurée dans le navigateur. Adapter le niveau de détail à la demande ; ne pas transformer une petite correction en refonte de moteur ou en cours.

## Commencer par le résultat et le projet

Identifier le rôle de la 3D, l'action principale de l'utilisateur, la direction visuelle et les appareils visés. Inspecter le framework, les dépendances réellement résolues, le renderer, les assets et le parcours existant avant de choisir une solution. Demander seulement ce qui change matériellement le résultat et reste inconnu.

Sur un nouveau projet sans contrainte, proposer une composition et une interaction concrètes, puis réaliser une première scène lisible avec des primitives. Remplacer les primitives par les assets définitifs après validation du cadrage. Ne pas inventer un modèle, une licence ou une référence visuelle prétendument fournie.

## Choisir la voie technique

| Contexte | Décision |
| --- | --- |
| Projet existant | Conserver sa stack, son gestionnaire de paquets et son renderer sauf besoin démontré. |
| Application React avec scène déclarative | Privilégier R3F et les helpers Drei utiles ; vérifier la compatibilité React/Fiber/Three. |
| Expérience autonome sans React | Three.js natif ; Vite et TypeScript sont des choix de départ, pas une migration obligatoire. |
| WebGL avec shaders personnalisés | GLSL et matériaux compatibles avec le renderer installé. |
| Besoin explicite WebGPU, TSL ou compute | Étudier WebGPURenderer et les nodes ; valider les fonctionnalités et le repli sur les appareils cibles. |

Ne pas choisir WebGPU pour sa seule nouveauté. Ne pas mélanger ShaderMaterial/RawShaderMaterial, onBeforeCompile ou EffectComposer WebGL avec une chaîne WebGPU sans portage validé. Consulter [shaders et renderers](references/shaders-renderers.md) pour les effets ou migrations.

## Expertise WebGPU / TSL

Les 21 leçons pédagogiques WebGPU/TSL ont été étudiées en texte intégral. Charger la fiche du problème à résoudre, puis les seules dépendances utiles :

| Travail | Référence opérationnelle |
| --- | --- |
| Matériau, espaces, types, uniforms, Fn, textures ou diagnostic | [Fondamentaux TSL](references/tsl-fundamentals.md), leçons 01–08. |
| Motifs, fumée, bloom/MRT/FXAA, bouclier, instancing ou pool VFX | [Effets et post-traitement](references/tsl-effects-postprocessing.md), leçons 09–14. |
| Sprites, trajectoires, émission et évolution compute | [Particules et compute](references/tsl-particles-compute.md), leçons 15–17. |
| Pétales, collisions, herbe/eau, neige persistante et normales | [Simulations et environnements](references/tsl-simulation-environments.md), leçons 18–21. |

Avant d'implémenter un effet, expliciter son contrat : données d'entrée et espace → calcul vertex/fragment/compute → sortie → paramètres modifiables → capacité et durée de vie → repli éventuel. Choisir une trajectoire analytique si elle suffit ; réserver le stockage persistant aux phénomènes qui dépendent de l'état précédent.

Lire un ancien état commun et écrire un nouvel état séparé pour un calcul dépendant des voisins ; ne pas reprendre les écritures concurrentes des démonstrations de sphères ou de flou. Pour les particules, conserver l'âge précédent lors de l'incrément : la fiche documente une coquille d'Anvil et sa correction testée.

Un [laboratoire original](references/validation-evidence.md) fournit un rendu TSL, une variation d'uniform et un test compute reproductible. Utiliser son code dans `assets/tsl-lab/` pour vérifier un environnement ou une régression ciblée ; il ne remplace pas la recette de l'expérience demandée.

## Boucle de réalisation

1. Fixer un critère observable : sujet cadré, action réalisable, comportement mobile et niveau de fluidité visé. Une cible de 60 FPS est un point de départ à mesurer, jamais une garantie.
2. Construire caméra, volumes et éclairage de base. Vérifier la silhouette, les contrastes et l'espace réservé au HTML avant les effets.
3. Ajouter l'interaction principale et les états chargement/échec/reprise. Séparer l'état métier des mises à jour par frame.
4. Intégrer les assets, matériaux et effets progressivement, en gardant une scène visible à chaque étape.
5. Mesurer, corriger le goulot d'étranglement et vérifier le rendu après chaque optimisation significative.
6. Livrer une preuve du résultat visible, les contrôles effectués et les limites restantes. Un build vert seul ne valide pas une scène 3D.

Pour architecture, animation, picking et cycle de vie : [runtime et interactions](references/runtime-interactions.md).
Pour glTF, textures, Blender et rendu baked/PBR : [assets et rendu](references/assets-rendering.md).
Pour diagnostic, budget et validation : [performance et recette](references/performance-validation.md).

## Utiliser la formation comme référence ciblée

Consulter [le catalogue et la provenance](references/course-index.md) pour choisir la leçon pertinente et vérifier sa couverture. Les fiches locales sont une synthèse originale des techniques, complétée par les docs officielles et des corrections d'ingénierie ; elles ne remplacent pas les supports de formation.

- Lire uniquement les leçons nécessaires via la session autorisée du navigateur. Si l'accès manque, le signaler et continuer avec les fiches ou les docs officielles lorsque cela suffit.
- Distinguer une leçon simplement répertoriée d'un passage effectivement lu. Ne pas affirmer que les vidéos ont été visionnées ni que toute la formation a été assimilée.
- Adapter les exemples à la version résolue du projet. Les versions figées, singletons ou raccourcis pédagogiques du cours ne sont pas des exigences de production.
- Ne pas stocker de cookies ou identifiants dans le skill. Ne pas modifier la progression ou répondre aux quiz pour consulter les cours.
- Garder les références locales ciblées ; ne pas recopier intégralement les cours, vidéos ou projets dans le skill. Pour un détail technique, conserver le lien et une note originale précisant le passage consulté.

## Compte rendu

Indiquer ce qui fonctionne, le choix technique déterminant, les vérifications réellement exécutées, puis les limites. Fournir une capture ou ouvrir la scène si les outils le permettent. Distinguer viewport mobile simulé, appareil réel, rendu GPU et simple compilation. Ne pas annoncer une compatibilité ou un niveau d'expertise validé par les seuls fichiers du skill.

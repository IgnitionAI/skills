---
name: design-with-references
description: Concevoir ou améliorer le design visuel de landing pages et interfaces web à partir de références, puis affiner le rendu réel. Utiliser pour une direction artistique, une interface trop générique, un redesign ou une passe de finition UI. Ne pas déclencher pour un simple bug fonctionnel sans demande de design.
---

# Design with References

Transformer des inspirations en une interface cohérente, adaptée au produit et vérifiée visuellement. Répondre dans la langue de l'utilisateur. Appliquer la profondeur utile à la demande ; ne pas imposer un atelier complet pour corriger un composant.

## Choisir le périmètre

- **Créer ou refondre** : établir une direction, implémenter un écran représentatif, puis étendre la composition au périmètre demandé.
- **Améliorer l'existant** : observer le rendu et conserver les conventions pertinentes ; corriger d'abord les défauts qui nuisent à la hiérarchie, à la lisibilité ou à l'action principale.
- **Auditer seulement** : produire des observations ancrées dans les captures, sans modifier le code.

Respecter le framework, les composants et le design system existants. Ne pas transformer une finition en migration technique, nouvelle identité ou refonte des parcours sans demande correspondante. Utiliser les outils réellement disponibles ; ne pas dépendre d'un plugin, abonnement ou skill tiers. Ne pas installer automatiquement les ressources citées dans une vidéo.

## 1. Comprendre et observer

Identifier dans le contexte : public, action principale, type d'écran, contenu réel, contraintes de marque et périmètre. Pour une application, considérer aussi la fréquence d'usage et la densité utile ; pour une landing page, la compréhension de l'offre et la progression vers l'action.

Inspecter les fichiers pertinents et, si accessible, le rendu actuel avant les modifications. Pour une demande purement conceptuelle, rester au niveau de la proposition. Réutiliser les informations déjà fournies ; poser une question seulement si une information manquante empêche un choix structurant. Sinon, annoncer brièvement l'hypothèse et avancer.

## 2. Exploiter les références

Examiner les captures et assets fournis. Une URL dont le contenu n'est pas accessible n'est pas une référence inspectée : le signaler sans inventer son apparence. Si aucune référence n'est disponible, partir du produit et de son identité existante ; pour une création libre, proposer une direction provisoire explicitement assumée. Ne pas bloquer le travail en exigeant un moodboard.

Sélectionner peu de références complémentaires, souvent deux ou trois suffisent. Pour chacune, préciser :

| Référence | Principe retenu | Adaptation au produit |
|---|---|---|
| Capture ou asset inspecté | Composition, typographie, densité, couleur ou interaction | Où et pourquoi ce principe sera utilisé |

Ne pas remplir ce tableau pour une petite correction. Extraire les principes plutôt que juxtaposer les styles. Distinguer référence d'inspiration et asset utilisable : ne pas reprendre automatiquement logos, textes ou images tiers. Ne pas considérer le mélange de plusieurs sites comme une garantie d'originalité.

Choisir des images qui servent le message et se recadrent correctement sur mobile. Préférer une capture produit pertinente à une illustration décorative sans rapport. Ne pas imposer d'images à une interface où elles gênent le travail.

## 3. Fixer une direction commune

Formuler une courte intention visuelle avec des décisions observables : hiérarchie typographique, largeur de contenu, rythme des espacements, palette et rôles des couleurs, surfaces, bordures, icônes et comportement des images. Traduire les adjectifs vagues comme « premium » en choix concrets.

Réutiliser les tokens existants ; compléter les manques dans le mécanisme du projet. Harmoniser les inspirations avec une seule grammaire de composants. Ne pas imposer systématiquement dégradés, cartes, ombres ou animations ; ne pas les bannir lorsqu'ils servent la direction choisie.

Conserver cette intention dans un document de design existant si le projet en possède un. Ne créer un document supplémentaire que si la durée ou l'étendue du travail le justifie.

## 4. Implémenter à la bonne échelle

Réaliser d'abord une composition représentative avec un contenu réaliste : premier écran pour une landing page, tâche principale pour une application. Vérifier sa cohérence avant de propager les choix. Continuer sans demander une validation intermédiaire sauf si l'utilisateur souhaite choisir une variante ou approuver une étape.

Conserver le fonctionnement des actions existantes. Ne pas inventer témoignages, logos clients, chiffres commerciaux ou fonctionnalités pour rendre une maquette convaincante. Identifier clairement les données de démonstration nécessaires.

Pour la finition, sélectionner les dimensions utiles au défaut observé :

- **Hiérarchie et layout** : rendre l'action principale identifiable, regrouper les éléments liés, corriger les alignements et équilibrer les espacements ; préserver la densité utile.
- **Typographie et contenu** : limiter les niveaux concurrents, ajuster longueur des lignes et retours à la ligne, employer des libellés décrivant l'action ou son résultat.
- **Couleur** : attribuer un rôle stable à chaque accent ; garder le texte lisible sur images et surfaces ; ne pas communiquer un état par la couleur seule.
- **Interactions et accessibilité** : préserver les éléments sémantiques, labels et focus visibles ; vérifier clavier et états pertinents des composants modifiés.
- **Mouvement** : expliquer une transition ou fournir du feedback ; respecter la réduction des animations et éviter de retarder une tâche pour un effet décoratif.

Ne pas exécuter systématiquement toutes les passes et ne pas ajouter de dépendance d'animation pour une transition CSS simple.

## 5. Vérifier le rendu et corriger

Quand l'environnement permet d'exécuter l'interface, utiliser son serveur et les outils de navigateur ou de capture disponibles. Inspecter réellement les images obtenues ; un build réussi ou une lecture du CSS ne valide pas le design.

Comparer avant/après dans les mêmes conditions. Pour un écran responsive, vérifier une largeur mobile et une largeur ordinateur, puis une largeur intermédiaire seulement si un problème de disposition le justifie. Pour un composant isolé, tester les contraintes de son conteneur.

Contrôler selon le périmètre : débordements, collisions, coupures de texte, recadrages, action principale et états représentatifs (chargement, vide, erreur, texte long). Tester les interactions affectées. Ne pas présenter une inspection visuelle comme une certification d'accessibilité.

Corriger d'abord les défauts bloquants, puis ceux qui nuisent à la lecture et enfin les détails esthétiques. Procéder par quelques corrections motivées par une observation ; refaire une capture après les changements significatifs. S'arrêter lorsque le périmètre demandé est cohérent, que les défauts matériels observés sont corrigés et que les contrôles ciblés passent. Éviter les refontes successives fondées sur la seule préférence du modèle.

Sans navigateur ou exécution disponible, faire les vérifications de code possibles, fournir le travail réalisable et préciser que le rendu reste à vérifier. Ne jamais affirmer avoir vu une capture non inspectée.

## Livrer

Présenter le résultat avec une capture ou un aperçu si disponible. Expliquer brièvement les changements perceptibles, ce qui a été vérifié et les limites restantes. Distinguer amélioration visuelle et impact métier : ne pas promettre un gain de conversion sans mesure. Ne pas publier ou déployer sur la seule base d'une demande d'amélioration du design.

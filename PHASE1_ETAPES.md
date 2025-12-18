## Etapes prevues pour la phase 1

1. **Structurer le projet**
   - Initialiser l'arborescence (core logique, moteur de recherche, interfaces I/O, tests).
   - Fixer les conventions (type hints Python 3.10+, formatage, tooling minimal sans dependances inutiles).

2. **Modeliser le plateau et les regles (variant 7x7, 2 dames)**
   - Representation simple (tableau 2D ou 1D) pour un plateau 7x7.
   - Position initiale: 2 amazones par camp placees dans les coins opposes (haut-gauche / bas-droit pour un camp, haut-droit / bas-gauche pour l'autre).
   - Encoder les etats: positions des amazones, cases bloquees, joueur actif.
   - Implementer l'application d'un coup (deplacement + tir de fleche) et la detection de fin de partie.

3. **Generer les coups**
   - Ecrire le generateur de coups legaux (deplacement type reine puis tir de fleche) avec validations rapides.
   - Ajouter des tests exhaustifs sur des positions canoniques (position initiale 7x7, blocs, positions de fin).

4. **Simulation visuelle de deux IA random (UI web statique)**
   - Deux joueurs aleatoires qui enchainent des coups jusqu'a fin de partie.
   - UI web locale (HTML/JS/CSS statique) servie par `python -m http.server` pour rester 100% reproductible.
   - Vue plateau 7x7 en grille claire, amazones contrastees, fleches visibles; palette simple (fond clair, cases alternees, surbrillance des derniers coups).
   - Controls: reset partie.
   - UX soignee: transitions douces pour les deplacements, legende minimale, responsive desktop/tablette.
   - Mode humain vs IA + selection du camp.
   - Choix IA aleatoire ou heuristique simple.
   - Onglet "Stats IA" pour lancer des matchs batch et voir le win rate.

5. **Evaluation et heuristiques de base**
   - Implementer une heuristique simple et deterministe (libertes accessibles, controle de zones). (fait: mobilite simple)
   - Prevoir une evaluation neutre pour MCTS si choisie.

6. **Moteur de recherche**
   - Option A: Alpha-beta avec iterative deepening, tri basique, coup killer/simple history.
   - Option B: MCTS pur CPU (UCT) avec playouts deterministes simples.
   - Ajouter la gestion du temps par budget fixe ou nombre de simulations/ noeuds.

7. **Interfaces et utils**
   - Fournir une API Python pour jouer un coup et obtenir la liste des coups.
   - Ajouter un CLI minimal pour jouer contre le moteur ou faire des matches batch.

8. **Tests et validation**
   - Couverture unitaire sur les regles, generateur, application de coups, et invariants d'etat.
   - Tests de non-regression sur des positions fixes avec hashes deterministes.

9. **Benchmarks et evaluation initiale**
   - Scripts de duel (moteur vs aleatoire / heuristique simple) pour mesurer le win rate. (fait: batch dans l'UI)
   - Collecter des stats (nodes/s, branching) pour guider les optimisations futures.

10. **Documentation**
   - Documenter l'API, le format des positions, les choix de representation et les parametres du moteur.
   - Rediger un guide de contribution et d'execution (CLI, tests, benchmarks).

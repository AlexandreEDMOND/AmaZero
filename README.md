## Objectif
- Construire un moteur Amazons (variant 7x7, 2 amazones par camp) avec visualisation web locale pour les duels IA aléatoires.

## Ce qui est fait (phase 1)
- Logique du jeu en Python : état immutable, génération de coups légaux, application de coups, partie aléatoire exportable.
- UI web locale statique (HTML/CSS/JS) : duel live de deux IA random, contrôles play/pause, reset, vitesse ; animation simple déplacement + flèche.
- Script utilitaire : génération d’une partie JSON (`scripts/generate_random_game.py`) si besoin.
- Tests unitaires sur règles, génération de coups, progression d’une partie (`tests/test_game.py`).

## Lancement rapide (uv)
```bash
# Lancer les tests
uv run python -m unittest discover -s tests -p "test*.py" -v

# Lancer l’UI web (serveur statique)
uv run python -m http.server 8000 -d ui
# puis ouvrir http://localhost:8000 et cliquer sur "Jouer"

# (Optionnel) Regénérer un enregistrement JSON
uv run python scripts/generate_random_game.py
```

## TODO (prochaines étapes)
- Ajouter heuristique/évaluation et moteur de recherche (alpha-beta ou MCTS CPU).
- Renforcer le générateur de coups (profiling, optimisations ciblées si besoin).
- Hooks d’API/CLI pour jouer contre le moteur et lancer des matchs batch.
- Scénarios de non-régression (positions fixes + hashes) et benchmarks simples (nodes/s, taux de victoire vs bots basiques).
- Documentation détaillée d’exécution (CLI, options, format des positions) et guide de contribution.

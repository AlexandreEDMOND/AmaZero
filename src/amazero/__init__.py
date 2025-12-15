"""Public API for the Amazons 7x7 variant (phase 1)."""

from .game import GameState, Move, play_random_game, save_game_record

__all__ = [
    "GameState",
    "Move",
    "play_random_game",
    "save_game_record",
]

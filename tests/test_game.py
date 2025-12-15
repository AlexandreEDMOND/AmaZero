import sys
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from amazero.game import GameState, Move, play_random_game  # noqa: E402


class GameStateTests(unittest.TestCase):
    def test_initial_positions(self):
        state = GameState.initial()
        size = state.size
        self.assertEqual(state.piece_at(0, 0), "W")
        self.assertEqual(state.piece_at(size - 1, size - 1), "W")
        self.assertEqual(state.piece_at(0, size - 1), "B")
        self.assertEqual(state.piece_at(size - 1, 0), "B")
        self.assertEqual(state.current_player, "W")

    def test_apply_move_and_turn_switch(self):
        state = GameState.initial()
        move = Move(origin=(0, 0), target=(1, 0), arrow=(0, 0))
        next_state = state.apply(move)
        self.assertEqual(next_state.piece_at(1, 0), "W")
        self.assertEqual(next_state.piece_at(0, 0), "X")  # arrow placed on origin
        self.assertEqual(next_state.current_player, "B")

    def test_legal_moves_produce_valid_states(self):
        state = GameState.initial()
        moves = list(state.legal_moves())
        self.assertGreater(len(moves), 0)
        # Sample a few moves and ensure apply does not raise
        for mv in moves[:25]:
            new_state = state.apply(mv)
            self.assertEqual(new_state.current_player, "B")
            # Board size unchanged and positions remain within bounds
            self.assertEqual(new_state.size, 7)

    def test_terminal_detection_when_blocked(self):
        rows = [
            "WXXXXXX",
            "XXXXXXX",
            "XXXXXXX",
            "XXXBXXX",
            "XXXXXXX",
            "XXXXXXX",
            "XXXXXXX",
        ]
        state = GameState.from_rows(rows, current_player="W")
        self.assertTrue(state.is_terminal())

    def test_random_game_progresses(self):
        history = play_random_game(max_turns=30)
        self.assertGreaterEqual(len(history), 2)
        # Each state should have a board of correct size
        size = 7
        for snapshot in history:
            board = snapshot["board"]
            self.assertEqual(len(board), size)
            for row in board:
                self.assertEqual(len(row), size)


if __name__ == "__main__":
    unittest.main()

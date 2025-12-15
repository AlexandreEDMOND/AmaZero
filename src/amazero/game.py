from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from random import choice, Random
from typing import Iterable, List, Sequence, Tuple
import json


EMPTY = "."
WHITE = "W"
BLACK = "B"
ARROW = "X"

PLAYER_ORDER = (WHITE, BLACK)
DIRS = [
    (-1, 0),
    (1, 0),
    (0, -1),
    (0, 1),
    (-1, -1),
    (-1, 1),
    (1, -1),
    (1, 1),
]


def _idx(size: int, row: int, col: int) -> int:
    return row * size + col


def _coords(size: int, index: int) -> Tuple[int, int]:
    return divmod(index, size)


@dataclass(frozen=True)
class Move:
    origin: Tuple[int, int]
    target: Tuple[int, int]
    arrow: Tuple[int, int]

    def as_dict(self) -> dict:
        return {
            "from": list(self.origin),
            "to": list(self.target),
            "arrow": list(self.arrow),
        }


class GameState:
    """Immutable game state for the 7x7, 2-amazons-per-side variant."""

    def __init__(self, size: int, board: Sequence[str], current_player: str):
        self.size = size
        self.board: Tuple[str, ...] = tuple(board)
        self.current_player = current_player

    @classmethod
    def initial(cls, size: int = 7) -> "GameState":
        board = [EMPTY] * (size * size)
        # White in (0,0) and (size-1, size-1); Black in (0, size-1) and (size-1, 0)
        placements = {
            WHITE: [(0, 0), (size - 1, size - 1)],
            BLACK: [(0, size - 1), (size - 1, 0)],
        }
        for color, coords in placements.items():
            for r, c in coords:
                board[_idx(size, r, c)] = color
        return cls(size=size, board=board, current_player=WHITE)

    @classmethod
    def from_rows(cls, rows: Sequence[str], current_player: str) -> "GameState":
        size = len(rows)
        flat: List[str] = []
        for row in rows:
            trimmed = row.strip()
            if len(trimmed) != size:
                raise ValueError("All rows must be length equal to board size")
            for ch in trimmed:
                if ch not in (EMPTY, WHITE, BLACK, ARROW):
                    raise ValueError(f"Invalid cell value {ch}")
                flat.append(ch)
        return cls(size=size, board=flat, current_player=current_player)

    def piece_at(self, row: int, col: int) -> str:
        return self.board[_idx(self.size, row, col)]

    def is_terminal(self) -> bool:
        return not any(self.legal_moves())

    def legal_moves(self) -> Iterable[Move]:
        size = self.size
        my_positions = [i for i, cell in enumerate(self.board) if cell == self.current_player]
        for pos in my_positions:
            r, c = _coords(size, pos)
            for mr, mc in DIRS:
                for step_to in self._ray_until_block(r, c, mr, mc, board=self.board):
                    to_r, to_c = step_to
                    intermediate_board = list(self.board)
                    intermediate_board[_idx(size, r, c)] = EMPTY
                    intermediate_board[_idx(size, to_r, to_c)] = self.current_player
                    for ar, ac in self._ray_until_block(to_r, to_c, 0, 0, board=intermediate_board, all_dirs=True):
                        if (ar, ac) == (to_r, to_c):
                            continue
                        yield Move(origin=(r, c), target=(to_r, to_c), arrow=(ar, ac))

    def _ray_until_block(
        self,
        row: int,
        col: int,
        dr: int,
        dc: int,
        *,
        board: Sequence[str],
        all_dirs: bool = False,
    ) -> Iterable[Tuple[int, int]]:
        """Yield squares reachable along one direction (or all if include_all_dirs)."""
        size = self.size
        directions = DIRS if all_dirs else [(dr, dc)]
        for ddr, ddc in directions:
            r, c = row + ddr, col + ddc
            while 0 <= r < size and 0 <= c < size:
                if board[_idx(size, r, c)] != EMPTY:
                    break
                yield (r, c)
                r += ddr
                c += ddc

    def apply(self, move: Move) -> "GameState":
        size = self.size
        board = list(self.board)
        fr = _idx(size, *move.origin)
        to = _idx(size, *move.target)
        ar = _idx(size, *move.arrow)
        if board[fr] != self.current_player:
            raise ValueError("Origin must contain current player's amazon")
        if board[to] != EMPTY:
            raise ValueError("Target must be empty")
        board[fr] = EMPTY
        board[to] = self.current_player
        if board[ar] != EMPTY or move.arrow == move.target:
            raise ValueError("Arrow must land on empty square distinct from target")
        board[ar] = ARROW
        next_player = BLACK if self.current_player == WHITE else WHITE
        return GameState(size=self.size, board=board, current_player=next_player)

    def pretty(self) -> str:
        rows = []
        for r in range(self.size):
            row = "".join(self.board[_idx(self.size, r, c)] for c in range(self.size))
            rows.append(row)
        return "\n".join(rows)

    def to_matrix(self) -> List[List[str]]:
        return [
            [self.board[_idx(self.size, r, c)] for c in range(self.size)]
            for r in range(self.size)
        ]


def play_random_game(rng: Random | None = None, size: int = 7, max_turns: int = 256):
    rng = rng or Random()
    state = GameState.initial(size=size)
    history: List[dict] = [
        {
            "player_to_move": state.current_player,
            "board": state.to_matrix(),
        }
    ]
    turn = 0
    while turn < max_turns and not state.is_terminal():
        moves = list(state.legal_moves())
        if not moves:
            break
        mv = choice(moves)
        mover = state.current_player
        state = state.apply(mv)
        history.append(
            {
                "move_player": mover,
                "player_to_move": state.current_player,
                "board": state.to_matrix(),
                "last_move": mv.as_dict(),
            }
        )
        turn += 1
    return history


def save_game_record(path: str | Path, history: List[dict], size: int = 7) -> None:
    record = {
        "size": size,
        "players": list(PLAYER_ORDER),
        "states": history,
    }
    Path(path).write_text(json.dumps(record, indent=2))

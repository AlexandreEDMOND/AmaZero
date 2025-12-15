"""Generate a random self-play game record and save it in ui/game_record.json."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from amazero import play_random_game, save_game_record  # noqa: E402


def main() -> None:
    history = play_random_game()
    output = Path(__file__).parent.parent / "ui" / "game_record.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    save_game_record(output, history, size=7)
    print(f"Wrote random game to {output}")


if __name__ == "__main__":
    main()

# Project: Amazons AI Engine

## Goal
Build a strong AI engine for the game of Amazons with the long-term objective of reaching a competitive level against top existing engines and strong human players.

This project is both:
- a research-oriented AI project (search + learning)
- a demonstrable, public-facing project

## Scope (Phase 1)
Phase 1 focuses on a classical engine running on CPU:
- Board size: 10x10 (standard Amazons)
- Fast and correct move generation
- Strong baseline using search (MCTS or alpha-beta)
- Clean, modular, well-documented code

No deep learning in Phase 1.

## Scope (Phase 2 - later)
Phase 2 will extend the engine with:
- Self-play
- Neural networks (policy/value)
- MCTS guided by a network (AlphaZero-like)

## Constraints
- Must run efficiently on CPU
- Deterministic and reproducible results
- Focus on clarity and correctness before optimization
- No premature micro-optimizations

## Evaluation
The engine will be evaluated by:
- Win rate against random and heuristic players
- Matches against existing Amazons engines
- Elo rating on online platforms (e.g. LittleGolem)

## Coding Guidelines
- Python 3.10+
- Prefer clarity over clever tricks
- Use type hints where helpful
- Modular architecture
- No unnecessary dependencies

## What Codex Should Do
- Generate clean, correct, and testable code
- Ask for clarification if rules or interfaces are ambiguous
- Avoid hallucinating rules of the game
- Implement rules exactly as specified

## Game Rules (Important)
- Amazons is played on a 10x10 board
- Each move consists of:
  1. Moving an amazon like a chess queen
  2. Shooting an arrow that blocks a square permanently
- A player loses when they have no legal moves

Rules must be implemented exactly.

## Current Implementation (Phase 1 progress)
- 7x7 variant with 2 amazons per side (local prototype).
- Web UI: live duel (AI vs AI), human vs AI, speed controls, and mode selection (random or simple heuristic).
- Stats tab: batch matches to estimate win rate for AI matchups.

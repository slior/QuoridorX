# Documentation Index

Welcome to the Quoridor project documentation. This index provides quick links to the most relevant docs and diagrams.

## Quick Links

- Main command flows (user-driven commands)
  - docs/main_flows.md
- AI-based flows (from CLI to AI execution)
  - docs/ai_flows.md

## Getting Started

- Project overview and usage examples
  - README.md
- Build, test, and coverage
  - See package.json scripts and README.md for details

## Code Structure (high level)

- Core game engine
  - src/core/Board.ts – board representation and rules (moves, walls, blocking)
  - src/core/Game.ts – game rules, turns, history (undo/redo)
- CLI (interactive shell)
  - src/cli/QuoridorCLI.ts – command loop, visualization, AI turn handling
  - src/cli/commands/* – user commands (move, wall, undo, redo, status)
  - src/cli/AIPlayerManager.ts – AI player lifecycle, move execution
  - src/cli/CLIArgumentParser.ts – command-line argument parsing
- AI
  - src/ai/strategy.ts – AI strategies (Random, Heuristic, Pathfinding)
  - src/ai/pathfinding/PathfindingUtils.ts – BFS/A* utilities
  - src/ai/pathfinding/BoardAnalyzer.ts – strategic evaluation helpers

## Diagrams

All sequence and flow diagrams are written in Mermaid and render on GitHub.
- docs/main_flows.md – user command flows (move, wall, undo)
- docs/ai_flows.md – AI flows (startup/config, AI turn loop, move calculation, wall impact, AI vs AI)

## Additional References

- Planning and notes
  - plan.md
  - PATHFINDING_IMPLEMENTATION_PLAN.md

If something is missing or unclear, please open an issue or add to this index.

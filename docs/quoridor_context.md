# Quoridor System Overview

## Purpose
The Quoridor system is a game application designed for users to play the Quoridor board game. It focuses on handling move, wall placement, and undo commands within the game.

## Key Components
1. **User**: Initiates commands.
2. **CLI (Command Line Interface)**: Processes and resolves user commands.
3. **Command Handlers (MoveCmd, WallCmd, UndoCmd)**: Validate and execute specific commands.
4. **Game Engine**: Manages game state, validations, and player interactions.
5. **Board**: Handles board operations and validations.
6. **State**: Manages the current game state and updates.
7. **GameState**: Represents the game state at a given point.
8. **GameHistory**: Stores and manages the history of game states for undo operations.

## Primary Interactions/Data Flows
- **Move Command Flow**: User inputs move command, CLI processes, and resolves, then Game Engine validates and updates the game state.

- **Wall Placement Command Flow**: WallCmd handles wall placement commands...
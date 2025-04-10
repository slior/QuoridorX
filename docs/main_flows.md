# Main Command Flows

## Move Command Flow

The following sequence diagram shows the flow of control when a player executes a move command in the game.

```mermaid
sequenceDiagram
    participant User
    participant CLI as QuoridorCLI
    participant MoveCmd as MoveCommand
    participant Game
    participant Board
    participant State as GameState

    User->>CLI: Input "move row col"
    CLI->>CLI: executeCommand()
    CLI->>CLI: resolveCommand()
    CLI->>CLI: executeGameCommand()
    CLI->>MoveCmd: execute(game, args)
    Note over MoveCmd: Validate args & parse coordinates
    MoveCmd->>Game: movePawn(playerId, targetPosition)
    Game->>Game: validateGameInProgress()
    Game->>Game: validatePlayerTurn()
    Game->>Game: saveCurrentState()
    Game->>Board: movePawn(playerId, targetPosition)
    Board->>Board: isValidMove() or isValidJump()
    Board-->>Game: Success/Error
    alt Success
        Game->>Game: isGoalPosition()
        alt Is Goal
            Game->>State: Update status to WIN
        else Not Goal
            Game->>Game: switchTurns()
        end
        CLI->>CLI: visualize board
        CLI->>CLI: updatePromptColor()
    else Error
        Game->>Game: Restore previous state
        Game-->>User: Display error message
    end
```

### Flow Description

1. User enters the move command with row and column coordinates
2. CLI processes the command through its command resolution system
3. The MoveCommand handler validates input and parses coordinates
4. Game engine validates game state and player turn
5. Current state is saved for potential rollback
6. Board validates and executes the move
7. On success:
   - Checks if move results in win
   - Updates game state
   - Switches turns
   - Updates visualization
8. On error:
   - Restores previous state
   - Shows error message to user 

## Wall Command Flow

The following sequence diagram shows the flow of control when a player places a wall.

```mermaid
sequenceDiagram
    participant User
    participant CLI as QuoridorCLI
    participant WallCmd as WallCommand
    participant Game
    participant Board
    participant State as GameState

    User->>CLI: Input "wall row col h/v"
    CLI->>CLI: executeCommand()
    CLI->>CLI: resolveCommand()
    CLI->>CLI: executeGameCommand()
    CLI->>WallCmd: execute(game, args)
    Note over WallCmd: Validate args & parse coordinates/orientation
    WallCmd->>Game: placeWall(playerId, wall)
    Game->>Game: validateGameInProgress()
    Game->>Game: validatePlayerTurn()
    Game->>Game: validatePlayer()
    Game->>Game: saveCurrentState()
    Game->>Game: Check remaining walls
    Game->>Board: placeWall(wall)
    Game->>Game: allPlayersHavePathToGoal()
    alt Valid Wall Placement
        Game->>Game: Update remaining walls
        Game->>Game: switchTurns()
        CLI->>CLI: visualize board
        CLI->>CLI: updatePromptColor()
    else Invalid Wall
        Game->>Board: removeLastWall()
        Game->>Game: Restore previous state
        Game-->>User: Display error message
    end
```

### Flow Description

1. User enters the wall command with row, column and orientation (h/v)
2. CLI processes the command through its command resolution system
3. The WallCommand handler validates input and creates wall object
4. Game engine performs validations:
   - Game in progress
   - Player's turn
   - Player has walls remaining
5. Current state is saved for potential rollback
6. Board places the wall and validates:
   - Wall position is valid
   - All players still have path to goal
7. On success:
   - Updates remaining walls count
   - Switches turns
   - Updates visualization
8. On error:
   - Removes placed wall
   - Restores previous state
   - Shows error message to user

## Undo Command Flow

The following sequence diagram shows the flow of control when a player undoes their last move.

```mermaid
sequenceDiagram
    participant User
    participant CLI as QuoridorCLI
    participant UndoCmd as UndoCommand
    participant Game
    participant Board
    participant History as GameHistory

    User->>CLI: Input "undo"
    CLI->>CLI: executeCommand()
    CLI->>CLI: resolveCommand()
    CLI->>CLI: executeGameCommand()
    CLI->>UndoCmd: execute(game, args)
    UndoCmd->>Game: undo()
    Game->>History: Pop last state
    alt Has Previous State
        Game->>Game: Save current to redo stack
        Game->>Board: Restore board state
        Game->>State: Restore game state
        Game->>Game: Restore remaining walls
        CLI->>CLI: visualize board
        CLI->>CLI: updatePromptColor()
    else No History
        Game-->>User: Display "Nothing to undo" message
    end
```

### Flow Description

1. User enters the undo command
2. CLI processes the command through its command resolution system
3. The UndoCommand handler triggers game's undo operation
4. Game engine checks for available history
5. If history exists:
   - Saves current state to redo stack
   - Restores previous board state
   - Restores previous game state
   - Restores previous wall counts
   - Updates visualization
6. If no history:
   - Shows error message to user 
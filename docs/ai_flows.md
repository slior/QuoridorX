# AI-Based Flows

This document focuses on AI-driven flows, from CLI configuration through move calculation and execution.

## Game Startup and AI Configuration

The following sequence diagram shows how the CLI parses arguments, configures players (human and AI), and starts the interactive loop.

```mermaid
sequenceDiagram
    participant User
    participant CLI as QuoridorCLI entrypoint
    participant ArgParser as CLIArgumentParser
    participant Game as Game
    participant Board as Board
    participant AIManager as AIPlayerManager

    User->>CLI: Start program (e.g., quoridor --p1=ai:pathfinding)
    CLI->>ArgParser: parse(args)
    ArgParser-->>CLI: GameConfig { player1, player2 }
    CLI->>Board: new Board() / with starting pawns
    CLI->>Game: new Game(board)
    CLI->>Game: addPlayer(1), addPlayer(2)
    CLI->>AIManager: new AIPlayerManager(game)
    AIManager->>AIManager: createPlayer(config.player1)
    AIManager->>AIManager: createPlayer(config.player2)
    CLI->>CLI: register commands
    CLI->>CLI: start() (visualize board, handle initial AI turn if needed)
```

### Flow Description

1. CLI parses --p1/--p2 into a GameConfig via CLIArgumentParser
2. A default Board and Game are initialized with starting pawns and two players
3. AIPlayerManager creates AI players based on the configuration (human vs AI, AI vs AI)
4. CLI registers commands then starts the prompt, running an initial AI turn if the current player is AI

## AI Turn Execution Flow (From CLI)

The following sequence shows how an AI turn is executed automatically by the CLI while the game is in progress.

```mermaid
sequenceDiagram
    participant CLI as QuoridorCLI
    participant Game as Game
    participant AIManager as AIPlayerManager
    participant AI as AIPlayer (Strategy)
    participant Vis as BoardVisualizer

    loop While Game in progress and current turn is AI
        CLI->>Game: getGameState()
        CLI->>AIManager: isAIPlayer(currentTurn)
        AIManager->>AIManager: getAIPlayer(currentTurn)
        AIManager-->>CLI: aiPlayer
        CLI->>AI: makeMove(game)
        AI-->>CLI: Move (either MOVE or WALL)
        CLI->>AIManager: executeSpecificMove(playerId, move)
        alt move.type == MOVE
            AIManager->>Game: movePawn(playerId, move.to)
        else move.type == WALL
            AIManager->>Game: placeWall(playerId, move.wall)
        end
        CLI->>Vis: visualize()
        CLI->>Game: getGameState()
        alt Game ended
            CLI->>CLI: run status command and break
        else Continue
            CLI->>CLI: updatePromptColor()
        end
    end
```

### Flow Description

1. CLI polls current GameState and checks if it is an AI turn
2. The AI player is retrieved from AIPlayerManager
3. The AI computes a Move and the CLI executes that exact move through AIPlayerManager
4. The board is visualized and the state is updated
5. Loop continues until either turn switches to human or the game ends

## AI Move Calculation (Pathfinding Strategy)

This diagram breaks down how an AI using the PathfindingStrategy determines its move.

```mermaid
sequenceDiagram
    participant Strategy as PathfindingStrategy
    participant MoveProvider as GameMoveProvider
    participant Game as Game
    participant Analyzer as BoardAnalyzer
    participant PF as PathfindingUtils

    Strategy->>MoveProvider: getValidMoves(state, playerId)
    MoveProvider-->>Strategy: List<Move>
    alt No valid moves
        Strategy-->>Strategy: throw "No valid moves"
    else Evaluate moves
        loop For each candidate Move
            alt Move is pawn MOVE
                Strategy->>PF: findOptimalPath(board, currentPos, goals)
                PF-->>Strategy: PathfindingResult
                Strategy->>Analyzer: evaluatePosition(game, playerId)
                Analyzer-->>Strategy: StrategicEvaluation
                Strategy-->>Strategy: score = f(path, evaluation, weights)
            else Move is WALL
                Strategy->>Analyzer: evaluateWallPlacement(game, playerId, wall)
                Analyzer-->>Strategy: WallImpactAnalysis
                Strategy-->>Strategy: score = g(impact, weights)
            end
        end
        Strategy-->>Strategy: select best scored move (with tie-breaker)
        Strategy-->>Caller: Move
    end
```

### Flow Description

1. Strategy asks GameMoveProvider for all valid moves in the current state
2. For pawn moves, Strategy uses PathfindingUtils to estimate path efficiency and BoardAnalyzer to evaluate strategic posture
3. For wall moves, Strategy requests BoardAnalyzer to evaluate wall impact, risk, and winning potential
4. Each move receives a score using configured evaluation weights; the top move is selected (deterministically with a tie-breaker)

## Wall Placement Impact Evaluation (Analyzer)

This sequence shows how BoardAnalyzer simulates a wall placement and measures its impact.

```mermaid
sequenceDiagram
    participant Analyzer as BoardAnalyzer
    participant Game as Game
    participant Board as Board
    participant PF as PathfindingUtils

    Analyzer->>Game: placeWall(playerId, wall) (simulated via game mechanics)
    alt Placement invalid
        Analyzer-->>Caller: { strategicValue:-1, risk:1, ... }
    else Placement valid
        Analyzer->>Board: getPawnPosition(player), getPawnPosition(opponent)
        Analyzer->>PF: findShortestPath(board, playerPos, playerGoals)
        PF-->>Analyzer: playerPathAfter
        Analyzer->>PF: findShortestPath(board, opponentPos, opponentGoals)
        PF-->>Analyzer: opponentPathAfter
        Analyzer->>Game: undo() (rollback simulated placement)
        Analyzer->>PF: findShortestPath(board, playerPos, playerGoals) (before)
        PF-->>Analyzer: playerPathBefore
        Analyzer->>PF: findShortestPath(board, opponentPos, opponentGoals) (before)
        PF-->>Analyzer: opponentPathBefore
        Analyzer-->>Caller: WallImpactAnalysis (Δplayer, Δopponent, strategicValue, risk, winningPotential)
    end
```

### Flow Description

1. Analyzer attempts to place the wall using the actual game mechanics; invalid placements return a conservative negative evaluation
2. On valid placement, Analyzer measures path lengths before/after for both players and computes an impact delta
3. It derives strategicValue, riskAssessment, and winningPotential from those deltas
4. The analyzer undoes any simulated wall placement to leave the game state unchanged

## AI vs AI Loop (Optional)

When both players are AI, the CLI continues alternating AI turns until the game ends.

```mermaid
flowchart TD
    A[Start CLI with --p1=ai:* --p2=ai:*] --> B[Initialize Game & AIManager]
    B --> C{Game in progress?}
    C -->|No| D[Exit]
    C -->|Yes| E{Current is AI?}
    E -->|No| F[Wait for human input]
    E -->|Yes| G[AI makeMove + execute]
    G --> H[Visualize board]
    H --> C
```

### Flow Description

- Both players are AI; the CLI loops through handleAITurns until GameStatus != IN_PROGRESS
- Each iteration fetches a move from the respective strategy and executes it via the game engine

---

Notes:
- These flows reflect current semantics: Game orchestrates rule enforcement and history; Board validates moves and walls; AI strategies are pure consumers of the current game/board state.
- The diagrams mirror the style of docs/main_flows.md, using sequence diagrams and flowcharts with a short description for each flow.

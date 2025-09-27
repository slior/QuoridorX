# Quoridor Game

A command shell implementation of the classic Quoridor board game. In Quoridor, players race to reach the opposite side of the board while placing walls to hinder their opponent's progress.

## Game Description

Quoridor is played on a 9×9 board where two players take turns either:
1. Moving their pawn one square orthogonally (up, down, left, or right)
2. Placing a wall to block their opponent's path

Each player starts with 10 walls. The first player to reach the opposite side of the board wins!

## Installation

```bash
# Clone the repository
git clone [repository-url]
cd quoridor

# Install dependencies
npm install

# Build the project
npm run build

# Create global command link (optional)
npm link
```

## Documentation

- See the Documentation Index: [docs/README.md](docs/README.md)

## Running the Game

You can start the game using one of these methods:

```bash
# Using npm
npm start

# Using the development mode (if you've made changes)
npm run dev

# Using the global command (if you've run npm link)
quoridor

# With TypeScript directly during development
npx ts-node src/index.ts
```

## Player Configuration

The game supports both human and AI players. You can configure player types using command-line arguments:

### Command-Line Options

- `--p1=<type>` - Configure Player 1 type (default: human)
- `--p2=<type>` - Configure Player 2 type (default: human)
- `--help` - Show help message

### Player Types

- `human` - Human player (interactive)
- `ai:random` - AI player using random strategy
- `ai:heuristic` - AI player using goal-oriented heuristic strategy
- `ai:pathfinding` - AI player using advanced pathfinding algorithms for optimal play

### Examples

```bash
# Default: Human vs Human
quoridor

# Human vs Random AI
quoridor --p2=ai:random

# Human vs Heuristic AI  
quoridor --p2=ai:heuristic

# Human vs Pathfinding AI (most challenging)
quoridor --p2=ai:pathfinding

# Random AI vs Human
quoridor --p1=ai:random

# AI vs AI
quoridor --p1=ai:heuristic --p2=ai:random

# Advanced AI vs Advanced AI
quoridor --p1=ai:pathfinding --p2=ai:pathfinding

# During development with TypeScript
npx ts-node src/index.ts -- --p2=ai:random

# Test advanced pathfinding AI during development
npx ts-node src/index.ts -- --p2=ai:pathfinding
```

### AI Strategies

- **Random Strategy**: Makes random valid moves from all available options
- **Heuristic Strategy**: Prioritizes moves that bring the player closer to their goal, with intelligent wall placement considerations  
- **Pathfinding Strategy**: Advanced AI using BFS/A* pathfinding algorithms to find optimal paths, strategic board analysis, and sophisticated move evaluation for competitive gameplay

## Game Commands

The game provides a command-line interface with the following commands:

### Movement Commands

- `move <row> <col>` - Move your pawn to the specified position
  ```
  quoridor> move 4 5
  ```

- `m <direction>` - Move your pawn in a relative direction (u/d/l/r)
  ```
  quoridor> m u  # Move up
  quoridor> m d  # Move down
  quoridor> m l  # Move left
  quoridor> m r  # Move right
  ```

### Wall Commands

- `wall <row> <col> <h/v>` - Place a wall at the specified position with orientation (horizontal/vertical)
  ```
  quoridor> wall 3 4 h  # Place horizontal wall at position (3,4)
  quoridor> wall 5 2 v  # Place vertical wall at position (5,2)
  ```

### Game Control Commands

- `status` - Show the current game status (current turn, remaining walls)
- `undo` - Undo the last move
- `redo` - Redo the last undone move
- `help` - Show available commands
- `quit` - Exit the game

## Project Structure

The project follows a modular architecture with clear separation of concerns:

```
src/
├── core/           # Core game logic
│   ├── Game.ts     # Main game engine
│   └── Board.ts    # Board representation
├── cli/            # Command-line interface
│   ├── commands/   # Command implementations
│   └── types/      # CLI-specific types
└── types/          # Shared type definitions
```

## Technologies/Libraries Used

- **TypeScript**: Main programming language
- **Node.js**: Runtime environment
- **Mocha & Chai**: Testing framework
- **c8**: Code coverage tool
- **chalk**: Terminal styling

## Development

### Building the Source

```bash
# Build the TypeScript source
npm run build

# Run tests
npm test

# Generate test coverage report
npm run coverage
```



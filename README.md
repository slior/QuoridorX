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

## Running the Game

You can start the game using one of these methods:

```bash
# Using npm
npm start

# Using the development mode (if you've made changes)
npm run dev

# Using the global command (if you've run npm link)
quoridor
```

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



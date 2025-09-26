# Quoridor Project Rules and Guidelines

## Project Overview
This is a TypeScript implementation of the Quoridor board game. The project focuses on clean, well-tested code with comprehensive game logic and AI capabilities.

## Development Rules

### Code Standards
- Use TypeScript strict mode and maintain type safety
- Follow consistent naming conventions (camelCase for variables/functions, PascalCase for classes)
- Write comprehensive JSDoc comments for all public methods
- Maintain test coverage above 80%
- Use conventional commit format for all commits

### Game Logic Rules
- All game state changes must be immutable
- Validate all moves according to official Quoridor rules
- Ensure shortest path always exists before placing walls
- Implement proper turn management and game end conditions
- AI decisions should be deterministic for testing purposes

### Testing Requirements
- Every public method must have unit tests
- Game scenarios should be tested with integration tests
- Edge cases and invalid moves must be tested
- Mock external dependencies in tests
- Test files should mirror source file structure

### File Organization
- Keep game logic separate from UI concerns
- Use dependency injection for better testability
- Organize by feature, not by file type
- Maintain clear separation between core game and AI logic

### Performance Guidelines
- Optimize board representation for frequent access
- Cache expensive pathfinding calculations when possible
- Profile AI decision-making algorithms
- Avoid unnecessary object creation in game loops

### Documentation Standards
- Update README.md for any user-facing changes
- Document game rules and strategies in `/docs`
- Include examples in code documentation
- Maintain architectural decision records for major changes

### Error Handling
- Use custom error types for game-specific errors
- Validate input parameters at public API boundaries
- Provide meaningful error messages for invalid moves
- Log important game state transitions for debugging

### AI Development
- AI should be modular and configurable
- Support different difficulty levels
- Implement both defensive and offensive strategies
- Ensure AI decisions are explainable for debugging

## Workflow Preferences
- Run tests before committing code
- Use feature branches for new development
- Squash commits before merging to main
- Update documentation alongside code changes

## Game Interface and Usage

### Running the Quoridor Game

There are multiple ways to start the game depending on your development context:

#### Development Mode (Recommended for development)
```bash
npm run dev
```
This runs the TypeScript source directly without compilation, ideal for development and testing.

#### Production Mode
```bash
# Build the project first
npm run build

# Then run the compiled version
npm start
```

#### Using the Binary (after npm link)
```bash
# Create global link (one-time setup)
npm link

# Run from anywhere
quoridor
```

### Game Commands Reference

The game provides an interactive CLI with colored prompts that change based on the current player turn.

#### Movement Commands

**Absolute Move**
- **Command**: `move <row> <col>`
- **Description**: Move your pawn to a specific board position
- **Examples**:
  ```
  quoridor> move 4 5    # Move to row 4, column 5
  quoridor> move 0 8    # Move to top-right corner
  ```

**Relative Move (Quick)**
- **Command**: `m <direction>`
- **Description**: Move one step in a direction (u/d/l/r)
- **Examples**:
  ```
  quoridor> m u         # Move up one step
  quoridor> m d         # Move down one step
  quoridor> m l         # Move left one step
  quoridor> m r         # Move right one step
  ```

#### Wall Placement

**Place Wall**
- **Command**: `wall <row> <col> <h/v>`
- **Description**: Place a wall at specified position with orientation
- **Parameters**:
  - `row`, `col`: Position coordinates (0-8)
  - `h`: Horizontal wall
  - `v`: Vertical wall
- **Examples**:
  ```
  quoridor> wall 3 4 h  # Horizontal wall at (3,4)
  quoridor> wall 5 2 v  # Vertical wall at (5,2)
  quoridor> wall 0 0 h  # Horizontal wall at top-left
  ```

#### Game Control Commands

**Status Information**
- **Command**: `status`
- **Description**: Shows current player turn, remaining walls for each player
- **Example**:
  ```
  quoridor> status
  Game Status:
  -----------
  Current turn: Player 1
  
  Remaining Walls:
  Player 1: 8
  Player 2: 10
  ```

**Undo/Redo System**
- **Commands**: `undo`, `redo`
- **Description**: Navigate through game history
- **Examples**:
  ```
  quoridor> undo        # Undo last move
  quoridor> redo        # Redo undone move
  ```

**Help and Exit**
- **Commands**: `help`, `quit`
- **Examples**:
  ```
  quoridor> help        # Show all available commands
  quoridor> quit        # Exit the game
  ```

### Game Board Coordinate System

- **Origin**: (0,0) at top-left corner
- **Board Size**: 9×9 grid (coordinates 0-8)
- **Player Starting Positions**:
  - Player 1: Top middle (0, 4)
  - Player 2: Bottom middle (8, 4)
- **Win Condition**: Reach the opposite side of the board

### Game Rules Implementation

- Each player starts with 10 walls
- Players alternate turns between moving and placing walls
- Pawns can jump over opponents when directly adjacent
- Walls must not completely block a player's path to victory
- Walls cannot overlap or intersect improperly

### Development Testing Tips

**Quick Game Test Session**:
```bash
npm run dev
# In game:
status          # Check initial state
m d             # Move player 1 down
wall 1 4 h      # Place horizontal wall
status          # Check updated state
undo            # Undo wall placement
quit            # Exit
```

**Error Handling Examples**:
- Invalid coordinates: `move 10 10` (out of bounds)
- Invalid wall placement: `wall 3 4 x` (invalid orientation)
- Blocked path: Wall placement that would trap a player
- Occupied position: Moving to a square with another pawn

### CLI Architecture Notes

- Commands are implemented as separate command classes
- Board visualization uses colored output (chalk library)
- Game state is immutable with history tracking
- Input parsing handles both absolute and relative coordinates
- Error messages provide usage hints for invalid commands

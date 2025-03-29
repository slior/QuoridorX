import chalk from 'chalk';
import { Board } from '../core/Board';
import { Position , P1, P2, PlayerID} from '../types/game';


interface ColorScheme {
    player1: chalk.Chalk;
    player2: chalk.Chalk;
    walls: chalk.Chalk;
    grid: chalk.Chalk;
    coordinates: chalk.Chalk;
}

const DEFAULT_COLOR_SCHEME: ColorScheme = {
    player1: chalk.red,
    player2: chalk.blue,
    walls: chalk.yellow,
    grid: chalk.gray,
    coordinates: chalk.dim
};

export class BoardVisualizer {
    private readonly board: Board;
    private readonly colorScheme: ColorScheme;

    constructor(board: Board, colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME) {
        this.board = board;
        this.colorScheme = colorScheme;
    }

    public getColorFor(player : PlayerID): chalk.Chalk
    {
        if (player == P1)
            return this.colorScheme.player1
        else if (player == P2)
            return this.colorScheme.player2
        else throw new Error("Invalid player id: " + player)
    }

    /**
     * Generate a string representation of the board with colors
     */
    public visualize(): string {
        const boardSize = this.board.getBoardSize();
        let output: string[] = [];

        // Add column coordinates
        output.push(this.drawColumnCoordinates());

        // Draw each row with walls and pawns
        for (let row = 0; row < boardSize; row++) {
            output.push(this.drawHorizontalGridLine(row));
            output.push(this.drawBoardRow(row));
        }

        // Add final horizontal line
        output.push(this.drawHorizontalGridLine(boardSize));

        return output.join('\n');
    }

    private drawColumnCoordinates(): string {
        const boardSize = this.board.getBoardSize();
        return this.colorScheme.coordinates('    ' + Array.from({length: boardSize}, (_, i) => `  ${i} `).join(''));
    }

    private drawHorizontalGridLine(row: number): string {
        const boardSize = this.board.getBoardSize();
        let line = '   ';
        
        for (let col = 0; col < boardSize; col++) {
            const hasHorizontalWall = this.hasHorizontalWall(row, col);
            const intersection = this.colorScheme.grid('+');
            const segment = hasHorizontalWall ? 
                this.colorScheme.walls('───') : 
                this.colorScheme.grid('---');
            
            line += intersection + segment;
        }
        
        return line + this.colorScheme.grid('+');
    }

    private drawBoardRow(row: number): string {
        const boardSize = this.board.getBoardSize();
        let rowStr = this.colorScheme.coordinates(` ${row} `);

        for (let col = 0; col < boardSize; col++) {
            // Add vertical wall or space before cell
            const hasVerticalWall = this.hasVerticalWall(row, col);
            const wallOrSpace = hasVerticalWall ? 
                this.colorScheme.walls('│') : 
                this.colorScheme.grid('|');
            
            rowStr += wallOrSpace;

            // Add cell content (pawn or empty space)
            const position = Position.create(row, col, boardSize);
            const cellContent = this.getCellContent(position);
            rowStr += cellContent;
        }

        // Add final vertical wall
        rowStr += this.colorScheme.grid('|');
        return rowStr;
    }

    private getCellContent(position: Position): string {
        // Check for pawns
        for (const playerId of [P1, P2] as PlayerID[]) {
            const pawnPos = this.board.getPawnPosition(playerId);
            if (pawnPos?.equals(position)) 
                return this.drawPawn(playerId);
            
        }
        return '   '; // Empty cell
    }

    private drawPawn(playerId : PlayerID) : string 
    {
        const color = playerId === P1 ? this.colorScheme.player1 : this.colorScheme.player2;
        return color(` ${playerId} `);
    }
    
    private hasHorizontalWall(row: number, col: number): boolean {
        try {
            const position = Position.create(row, col, this.board.getBoardSize());
            return this.board.isWallBetween(position, position.up());
        } catch {
            return false;
        }
    }

    private hasVerticalWall(row: number, col: number): boolean {
        try {
            const position = Position.create(row, col, this.board.getBoardSize());
            return this.board.isWallBetween(position, position.left());
        } catch {
            return false;
        }
    }
} 
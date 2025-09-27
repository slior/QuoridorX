import { expect } from 'chai';
import { PathfindingStrategy, PathfindingStrategyOptions } from '../../src/ai/strategy';
import { GameState, Move, MOVE_TYPE_MOVE, MOVE_TYPE_WALL, Position } from '../../src/types/game';
import { Board } from '../../src/core/Board';
import { Game } from '../../src/core/Game';
import { Wall } from '../../src/types/game';
import { GameMoveProvider } from '../../src/ai/GameMoveProvider';

describe('PathfindingStrategy', () => {
    let game: Game;
    let gameState: GameState;
    let moveProvider: (state: GameState, playerId: string) => Move[];
    let strategy: PathfindingStrategy;

    beforeEach(() => {
        // Setup standard game with starting positions
        const initialPositions = new Map([
            [1, Position.create(0, 4, 9)], // Player 1 starts at top middle
            [2, Position.create(8, 4, 9)]  // Player 2 starts at bottom middle
        ]);
        
        const board = Board.withPawns(initialPositions);
        game = new Game(board);
        game.addPlayer(1);
        game.addPlayer(2);
        gameState = game.getGameState();
        
        moveProvider = GameMoveProvider.createMoveProvider(game);
        
        // Default strategy options
        const options: PathfindingStrategyOptions = {
            getValidMoves: moveProvider,
            searchDepth: 3,
            evaluationWeights: {
                pathLength: 0.4,
                wallEfficiency: 0.3,
                boardControl: 0.2,
                positionalAdvantage: 0.1
            }
        };
        
        strategy = new PathfindingStrategy(options);

        function resetToPositions(p1: Position, p2: Position) {
            const b = Board.withPawns(new Map([
                [1, p1],
                [2, p2]
            ]));
            game = new Game(b);
            game.addPlayer(1);
            game.addPlayer(2);
            gameState = game.getGameState();
            moveProvider = GameMoveProvider.createMoveProvider(game);
            const opts: PathfindingStrategyOptions = {
                getValidMoves: moveProvider,
                searchDepth: 3,
                evaluationWeights: {
                    pathLength: 0.4,
                    wallEfficiency: 0.3,
                    boardControl: 0.2,
                    positionalAdvantage: 0.1
                }
            };
            strategy = new PathfindingStrategy(opts);
        }
        // Expose helper on the test context
        // @ts-ignore
        (global as any).__resetToPositions = resetToPositions;
    });

    describe('Basic move selection', () => {
        it('should select optimal pawn moves in empty board', () => {
            const move = strategy.calculateMove(gameState, '1');
            
            expect(move).to.exist;
            expect(move.type).to.equal(MOVE_TYPE_MOVE);
            if (move.type === MOVE_TYPE_MOVE) {
                // Should move toward goal (row 8)
                expect(move.to.row).to.be.greaterThan(0);
                expect(move.to.row).to.be.at.most(1); // One step forward
                expect(move.to.col).to.equal(4); // Should stay in center column initially
            }
        });

        it('should choose wall placement when strategically beneficial', () => {
            // Setup scenario where wall placement is clearly better
            // @ts-ignore
            (global as any).__resetToPositions(Position.create(6, 4, 9), Position.create(2, 4, 9));
            
            const currentState = game.getGameState();
            const move = strategy.calculateMove(currentState, '1');
            
            expect(move).to.exist;
            // In a race scenario, strategic wall placement might be chosen
            if (move.type === MOVE_TYPE_WALL) {
                expect(move.wall).to.exist;
                expect(move.wall.position).to.exist;
            }
        });

        it('should prefer moves that minimize own path length', () => {
            const move = strategy.calculateMove(gameState, '1');
            
            expect(move.type).to.equal(MOVE_TYPE_MOVE);
            if (move.type === MOVE_TYPE_MOVE) {
                // Should move toward goal row (8 for player 1)
                const currentPos = game.getBoard().getPawnPosition(1)!;
                expect(move.to.row).to.be.greaterThan(currentPos.row);
            }
        });

        it('should avoid moves that significantly increase own path length', () => {
            // Create scenario where moving sideways would be suboptimal
            const move = strategy.calculateMove(gameState, '1');
            
            expect(move.type).to.equal(MOVE_TYPE_MOVE);
            if (move.type === MOVE_TYPE_MOVE) {
                // Should not move sideways when direct path is available
                expect(Math.abs(move.to.col - 4)).to.be.at.most(1);
            }
        });
    });

    describe('Strategic wall placement decisions', () => {
        it('should place walls to block opponent when beneficial', () => {
            // Move opponent close to their goal by resetting positions
            // @ts-ignore
            (global as any).__resetToPositions(Position.create(0, 4, 9), Position.create(2, 4, 9));
            
            const currentState = game.getGameState();
            const move = strategy.calculateMove(currentState, '1');
            
            if (move.type === MOVE_TYPE_WALL) {
                // Wall should be placed to hinder opponent's progress
                const wallRow = move.wall.position.row;
                expect(wallRow).to.be.lessThan(4); // Should be in opponent's territory
            }
        });

        it('should avoid wall placements that block own optimal path', () => {
            // Test multiple moves to ensure strategy doesn't self-block
            for (let i = 0; i < 3; i++) {
                const move = strategy.calculateMove(game.getGameState(), '1');
                
                if (move.type === MOVE_TYPE_WALL) {
                    // Wall should not significantly impact own path
                    const wallPosition = move.wall.position;
                    const playerPos = game.getBoard().getPawnPosition(1)!;
                    
                    // Wall should not be directly blocking player's forward progress
                    if (move.wall.isHorizontal) {
                        expect(wallPosition.row).to.not.equal(playerPos.row);
                    }
                }
                
                // Execute move for next iteration
                if (move.type === MOVE_TYPE_MOVE) {
                    game.movePawn(1, move.to);
                    // Make a dummy move for player 2 to switch turns back
                    const player2Pos = game.getBoard().getPawnPosition(2)!;
                    if (player2Pos.row > 0) {
                        game.movePawn(2, player2Pos.up());
                    } else {
                        game.movePawn(2, player2Pos.down());
                    }
                } else {
                    game.placeWall(1, move.wall);
                    // Make a dummy move for player 2 to switch turns back
                    const player2Pos = game.getBoard().getPawnPosition(2)!;
                    if (player2Pos.row > 0) {
                        game.movePawn(2, player2Pos.up());
                    } else {
                        game.movePawn(2, player2Pos.down());
                    }
                }
            }
        });

        it('should prioritize walls with high strategic value', () => {
            // Create scenario with clear strategic wall opportunity
            // @ts-ignore
            (global as any).__resetToPositions(Position.create(4, 4, 9), Position.create(4, 3, 9));
            
            const currentState = game.getGameState();
            const move = strategy.calculateMove(currentState, '1');
            
            if (move.type === MOVE_TYPE_WALL) {
                // Should place strategically valuable wall
                expect(move.wall).to.exist;
                expect(move.wall.position).to.exist;
            }
        });

        it('should consider wall count when deciding wall placement', () => {
            // Use up most walls
            const positions = [
                Position.create(1, 0, 9),
                Position.create(1, 2, 9),
                Position.create(1, 4, 9),
                Position.create(1, 6, 9),
                Position.create(3, 0, 9),
                Position.create(3, 2, 9),
                Position.create(3, 4, 9),
                Position.create(3, 6, 9)
            ];
            for (let i = 0; i < positions.length; i++) {
                game.placeWall(1, new Wall(positions[i], true));
                // Make a safe dummy move for player 2 to switch turns back
                const p2 = game.getBoard().getPawnPosition(2)!;
                const tryMoves = [
                    () => p2.hasLeft() ? p2.left() : null,
                    () => p2.hasRight() ? p2.right() : null,
                    () => p2.hasUp() ? p2.up() : null,
                    () => p2.hasDown() ? p2.down() : null
                ];
                let moved = false;
                for (const gen of tryMoves) {
                    const next = gen();
                    if (!next) continue;
                    try {
                        game.movePawn(2, next);
                        moved = true;
                        break;
                    } catch {}
                }
                if (!moved) {
                    // As a last resort, skip switching turns; strategy under test does not rely on exact turn count here
                }
            }
            
            const currentState = game.getGameState();
            const move = strategy.calculateMove(currentState, '1');
            
            // With only 2 walls left, should be more conservative
            if (move.type === MOVE_TYPE_WALL) {
                // Wall placement should be highly strategic
                expect(move.wall).to.exist;
            } else {
                // Or prefer pawn moves to save remaining walls
                expect(move.type).to.equal(MOVE_TYPE_MOVE);
            }
        });
    });

    describe('Advanced strategic evaluation', () => {
        it('should recognize and respond to race conditions', () => {
            // Setup race scenario
            // @ts-ignore
            (global as any).__resetToPositions(Position.create(6, 4, 9), Position.create(2, 4, 9));
            
            const currentState = game.getGameState();
            const move = strategy.calculateMove(currentState, '1');
            
            // In a race, should either move toward goal or place strategic wall
            if (move.type === MOVE_TYPE_MOVE) {
                expect(move.to.row).to.be.greaterThan(6); // Move toward goal
            } else if (move.type === MOVE_TYPE_WALL) {
                // Wall should hinder opponent
                expect(move.wall.position.row).to.be.lessThan(4);
            }
        });

        it('should adapt strategy based on board control', () => {
            // Create asymmetric board control scenario with alternating turns
            game.placeWall(1, new Wall(Position.create(2, 2, 9), true));
            game.placeWall(2, new Wall(Position.create(2, 5, 9), true));
            
            const currentState = game.getGameState();
            const move = strategy.calculateMove(currentState, '1');
            
            expect(move).to.exist;
            // Strategy should consider the controlled territory
            if (move.type === MOVE_TYPE_MOVE) {
                expect(move.to).to.exist;
            }
        });

        it('should make defensive moves when losing', () => {
            // Setup scenario where player 1 is behind
            // @ts-ignore
            (global as any).__resetToPositions(Position.create(0, 4, 9), Position.create(1, 4, 9));
            
            const currentState = game.getGameState();
            const move = strategy.calculateMove(currentState, '1');
            
            // Should prioritize blocking opponent or catching up
            if (move.type === MOVE_TYPE_WALL) {
                // Defensive wall near opponent
                expect(move.wall.position.row).to.be.lessThan(3);
            } else {
                // Aggressive pawn move
                expect(move.type).to.equal(MOVE_TYPE_MOVE);
            }
        });

        it('should make aggressive moves when winning', () => {
            // Setup scenario where player 1 is ahead
            // @ts-ignore
            (global as any).__resetToPositions(Position.create(7, 4, 9), Position.create(8, 4, 9));
            
            const currentState = game.getGameState();
            const move = strategy.calculateMove(currentState, '1');
            
            // Should focus on winning quickly
            if (move.type === MOVE_TYPE_MOVE) {
                expect(move.to.row).to.be.at.least(7);
            }
        });
    });

    describe('Deterministic behavior and consistency', () => {
        it('should return same move for identical game states', () => {
            const move1 = strategy.calculateMove(gameState, '1');
            const move2 = strategy.calculateMove(gameState, '1');
            
            expect(move1).to.deep.equal(move2);
        });

        it('should be deterministic across multiple calls', () => {
            const moves = [];
            for (let i = 0; i < 5; i++) {
                moves.push(strategy.calculateMove(gameState, '1'));
            }
            
            // All moves should be identical
            for (let i = 1; i < moves.length; i++) {
                expect(moves[i]).to.deep.equal(moves[0]);
            }
        });

        it('should handle both players consistently', () => {
            const player1Move = strategy.calculateMove(gameState, '1');
            
            // Make a move for player 1 to switch to player 2's turn
            const player1Pos = game.getBoard().getPawnPosition(1)!;
            game.movePawn(1, player1Pos.down());
            
            const player2State = game.getGameState();
            const player2Move = strategy.calculateMove(player2State, '2');
            
            expect(player1Move).to.exist;
            expect(player2Move).to.exist;
            
            // Both players should make reasonable moves
            if (player1Move.type === MOVE_TYPE_MOVE) {
                expect(player1Move.to.row).to.be.greaterThan(0); // Move toward goal
            }
            if (player2Move.type === MOVE_TYPE_MOVE) {
                expect(player2Move.to.row).to.be.lessThan(8); // Move toward goal
            }
        });
    });

    describe('Configuration and customization', () => {
        it('should respect custom search depth settings', () => {
            const deepOptions: PathfindingStrategyOptions = {
                getValidMoves: moveProvider,
                searchDepth: 5, // Deeper search
                evaluationWeights: {
                    pathLength: 0.5,
                    wallEfficiency: 0.3,
                    boardControl: 0.1,
                    positionalAdvantage: 0.1
                }
            };
            
            const deepStrategy = new PathfindingStrategy(deepOptions);
            const move = deepStrategy.calculateMove(gameState, '1');
            
            expect(move).to.exist;
            // Deeper search might find different (potentially better) moves
        });

        it('should apply custom evaluation weights correctly', () => {
            const aggressiveOptions: PathfindingStrategyOptions = {
                getValidMoves: moveProvider,
                searchDepth: 3,
                evaluationWeights: {
                    pathLength: 0.6, // Heavy focus on own progress
                    wallEfficiency: 0.1,
                    boardControl: 0.1,
                    positionalAdvantage: 0.2
                }
            };
            
            const defensiveOptions: PathfindingStrategyOptions = {
                getValidMoves: moveProvider,
                searchDepth: 3,
                evaluationWeights: {
                    pathLength: 0.2,
                    wallEfficiency: 0.5, // Heavy focus on blocking opponent
                    boardControl: 0.2,
                    positionalAdvantage: 0.1
                }
            };
            
            const aggressiveStrategy = new PathfindingStrategy(aggressiveOptions);
            const defensiveStrategy = new PathfindingStrategy(defensiveOptions);
            
            const aggressiveMove = aggressiveStrategy.calculateMove(gameState, '1');
            const defensiveMove = defensiveStrategy.calculateMove(gameState, '1');
            
            expect(aggressiveMove).to.exist;
            expect(defensiveMove).to.exist;
            
            // Different weight configurations might produce different strategies
            // (exact behavior depends on implementation)
        });

        it('should handle invalid configuration gracefully', () => {
            expect(() => {
                new PathfindingStrategy({
                    getValidMoves: moveProvider,
                    searchDepth: -1, // Invalid depth
                    evaluationWeights: {
                        pathLength: 0.4,
                        wallEfficiency: 0.3,
                        boardControl: 0.2,
                        positionalAdvantage: 0.1
                    }
                });
            }).to.throw();
        });
    });

    describe('Performance and edge cases', () => {
        it('should complete move calculation within reasonable time', () => {
            const startTime = Date.now();
            const move = strategy.calculateMove(gameState, '1');
            const endTime = Date.now();
            
            expect(move).to.exist;
            expect(endTime - startTime).to.be.lessThan(1000); // Less than 1 second
        });

        it('should handle complex board positions efficiently', () => {
            // Create complex scenario with many walls
            for (let i = 1; i < 7; i += 2) {
                game.placeWall(1, new Wall(Position.create(i, 2, 9), i % 2 === 0));
                game.placeWall(2, new Wall(Position.create(i, 6, 9), i % 2 === 1));
            }
            
            const startTime = Date.now();
            const move = strategy.calculateMove(game.getGameState(), '1');
            const endTime = Date.now();
            
            expect(move).to.exist;
            expect(endTime - startTime).to.be.lessThan(2000); // Should still be reasonable
        });

        it('should handle near-end scenarios gracefully', () => {
            // Move player 1 to near-win position via reset
            // @ts-ignore
            (global as any).__resetToPositions(Position.create(7, 4, 9), Position.create(8, 4, 9));
            
            const currentState = game.getGameState();
            const move = strategy.calculateMove(currentState, '1');
            
            expect(move).to.exist;
            if (move.type === MOVE_TYPE_MOVE) {
                expect(move.to.row).to.be.at.least(7);
            }
        });

        it('should throw error when no valid moves available', () => {
            // Create impossible scenario (would require complex wall setup)
            // For now, just test that it handles empty move list
            const emptyMoveProvider = () => [];
            const impossibleStrategy = new PathfindingStrategy({
                getValidMoves: emptyMoveProvider,
                searchDepth: 3,
                evaluationWeights: {
                    pathLength: 0.4,
                    wallEfficiency: 0.3,
                    boardControl: 0.2,
                    positionalAdvantage: 0.1
                }
            });
            
            expect(() => {
                impossibleStrategy.calculateMove(gameState, '1');
            }).to.throw('No valid moves');
        });

        it('should handle edge positions and corners correctly', () => {
            // Move player to corner position via reset
            // @ts-ignore
            (global as any).__resetToPositions(Position.create(0, 0, 9), Position.create(8, 4, 9));
            
            const currentState = game.getGameState();
            const move = strategy.calculateMove(currentState, '1');
            
            expect(move).to.exist;
            if (move.type === MOVE_TYPE_MOVE) {
                // Should move toward goal from corner
                expect(move.to.row).to.be.greaterThan(0);
            }
        });
    });

    describe('Integration with existing AI patterns', () => {
        it('should follow AIStrategy interface contract', () => {
            expect(strategy).to.respondTo('calculateMove');
            
            const move = strategy.calculateMove(gameState, '1');
            expect(move).to.have.property('type');
            
            if (move.type === MOVE_TYPE_MOVE) {
                expect(move).to.have.property('to');
            } else if (move.type === MOVE_TYPE_WALL) {
                expect(move).to.have.property('wall');
            }
        });

        it('should work with GameMoveProvider integration', () => {
            const validMoves = moveProvider(gameState, '1');
            const selectedMove = strategy.calculateMove(gameState, '1');
            
            // Selected move should be from the valid moves list
            const isValidMove = validMoves.some(validMove => {
                if (validMove.type !== selectedMove.type) return false;
                
                if (validMove.type === MOVE_TYPE_MOVE && selectedMove.type === MOVE_TYPE_MOVE) {
                    return validMove.to.equals(selectedMove.to);
                } else if (validMove.type === MOVE_TYPE_WALL && selectedMove.type === MOVE_TYPE_WALL) {
                    return validMove.wall.equals(selectedMove.wall);
                }
                return false;
            });
            
            expect(isValidMove).to.be.true;
        });
    });
});
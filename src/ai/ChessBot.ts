import { ChessEngine } from '../engine/ChessEngine';
import { Position, Color } from '../types/chess.types';

export class ChessBot {
  private engine: ChessEngine;
  private difficulty: 'easy' | 'medium' | 'hard';
  private pieceValues = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
  private evaluationCache: Map<string, number> = new Map();

  constructor(engine: ChessEngine, difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.engine = engine;
    this.difficulty = difficulty;
  }

  public getMove(): { from: Position; to: Position } | null {
    const state = this.engine.getGameState();
    const depth = this.difficulty === 'easy' ? 2 : this.difficulty === 'medium' ? 3 : 4;

    let bestMove = null;
    let bestScore = -Infinity;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = state.board[row][col];
        if (piece && piece.color === state.currentPlayer) {
          const moves = this.engine.selectSquare({ row, col });
          for (const move of moves) {
            // Simulate move
            this.engine.movePiece({ row, col }, move);
            const score = this.minimax(depth - 1, -Infinity, Infinity, false);
            this.engine.undoLastMove();

            if (score > bestScore) {
              bestScore = score;
              bestMove = { from: { row, col }, to: move };
            }
          }
        }
      }
    }

    return bestMove;
  }

  private minimax(depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
    if (depth === 0) {
      return this.evaluateBoard();
    }

    const state = this.engine.getGameState();

    if (state.isCheckmate) {
      return isMaximizing ? -1000 : 1000;
    }

    if (state.isStalemate) {
      return 0;
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = state.board[row][col];
          if (piece && piece.color === state.currentPlayer) {
            const moves = this.engine.selectSquare({ row, col });
            for (const move of moves) {
              this.engine.movePiece({ row, col }, move);
              const score = this.minimax(depth - 1, alpha, beta, false);
              this.engine.undoLastMove();

              maxEval = Math.max(maxEval, score);
              alpha = Math.max(alpha, maxEval);
              if (beta <= alpha) break;
            }
          }
        }
      }
      return maxEval === -Infinity ? 0 : maxEval;
    } else {
      let minEval = Infinity;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = state.board[row][col];
          if (piece && piece.color === state.currentPlayer) {
            const moves = this.engine.selectSquare({ row, col });
            for (const move of moves) {
              this.engine.movePiece({ row, col }, move);
              const score = this.minimax(depth - 1, alpha, beta, true);
              this.engine.undoLastMove();

              minEval = Math.min(minEval, score);
              beta = Math.min(beta, minEval);
              if (beta <= alpha) break;
            }
          }
        }
      }
      return minEval === Infinity ? 0 : minEval;
    }
  }

  private evaluateBoard(): number {
    const state = this.engine.getGameState();
    let score = 0;

    // Material value
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = state.board[row][col];
        if (piece) {
          const value = this.pieceValues[piece.type as keyof typeof this.pieceValues];
          score += piece.color === 'white' ? value : -value;
        }
      }
    }

    // Positional bonus
    score += this.calculatePositionalScore(state);

    // Check bonus
    if (state.isCheck) {
      score += state.currentPlayer === 'white' ? -50 : 50;
    }

    return score;
  }

  private calculatePositionalScore(state: any): number {
    let score = 0;

    const centerSquares = [
      [3, 3], [3, 4], [4, 3], [4, 4],
      [2, 3], [2, 4], [3, 2], [4, 5], [5, 3], [5, 4], [3, 5], [4, 2],
    ];

    for (const [row, col] of centerSquares) {
      const piece = state.board[row][col];
      if (piece && piece.type !== 'king' && piece.type !== 'pawn') {
        score += piece.color === 'white' ? 10 : -10;
      }
    }

    // Pawn structure bonus
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = state.board[row][col];
        if (piece && piece.type === 'pawn') {
          const advancement = piece.color === 'white' ? (6 - row) : row - 1;
          score += piece.color === 'white' ? advancement : -advancement;
        }
      }
    }

    return score;
  }

  public setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
    this.evaluationCache.clear();
  }
}
import React from 'react';
import { Position, Piece, GameState } from '../types/chess.types';
import '../styles/ChessBoard.css';

interface ChessBoardProps {
  gameState: GameState;
  onSquareClick: (position: Position) => void;
  onMoveMade: (from: Position, to: Position) => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ gameState, onSquareClick, onMoveMade }) => {
  const pieces: { [key: string]: string } = {
    'pawn-white': '♙',
    'pawn-black': '♟',
    'rook-white': '♖',
    'rook-black': '♜',
    'knight-white': '♘',
    'knight-black': '♞',
    'bishop-white': '♗',
    'bishop-black': '♝',
    'queen-white': '♕',
    'queen-black': '♛',
    'king-white': '♔',
    'king-black': '♚',
  };

  const handleSquareClick = (row: number, col: number) => {
    const position: Position = { row, col };

    if (gameState.selectedSquare === null) {
      onSquareClick(position);
    } else {
      const isValidMove = gameState.validMoves.some(
        (move) => move.row === row && move.col === col
      );

      if (isValidMove) {
        onMoveMade(gameState.selectedSquare, position);
      } else {
        onSquareClick(position);
      }
    }
  };

  const isHighlighted = (row: number, col: number): boolean => {
    return gameState.validMoves.some((move) => move.row === row && move.col === col);
  };

  const isSelected = (row: number, col: number): boolean => {
    return (
      gameState.selectedSquare !== null &&
      gameState.selectedSquare.row === row &&
      gameState.selectedSquare.col === col
    );
  };

  const getPieceSymbol = (piece: Piece | null): string => {
    if (!piece) return '';
    return pieces[`${piece.type}-${piece.color}`] || '';
  };

  return (
    <div className="chess-board">
      {gameState.board.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const isWhiteSquare = (rowIndex + colIndex) % 2 === 0;
          const isHighlightedSquare = isHighlighted(rowIndex, colIndex);
          const isSelectedSquare = isSelected(rowIndex, colIndex);

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`square ${isWhiteSquare ? 'white' : 'black'} ${
                isHighlightedSquare ? 'highlighted' : ''
              } ${isSelectedSquare ? 'selected' : ''}`}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
            >
              <div className="piece">{getPieceSymbol(piece)}</div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChessBoard;
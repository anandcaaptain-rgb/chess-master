import React from 'react';
import { GameState, Color } from '../types/chess.types';
import '../styles/GameInfo.css';

interface GameInfoProps {
  gameState: GameState;
  playerColor?: Color;
}

const GameInfo: React.FC<GameInfoProps> = ({ gameState, playerColor = 'white' }) => {
  const formatMoveHistory = (): string[] => {
    const moves: string[] = [];
    for (let i = 0; i < gameState.moveHistory.length; i += 2) {
      const whiteMove = gameState.moveHistory[i];
      const blackMove = gameState.moveHistory[i + 1];

      let moveText = `${Math.floor(i / 2) + 1}. ${formatMove(whiteMove)}`;
      if (blackMove) {
        moveText += ` ${formatMove(blackMove)}`;
      }
      moves.push(moveText);
    }
    return moves;
  };

  const formatMove = (move: any): string => {
    return `${String.fromCharCode(97 + move.from.col)}${8 - move.from.row}-${String.fromCharCode(
      97 + move.to.col
    )}${8 - move.to.row}`;
  };

  return (
    <div className="game-info">
      <div className="status">
        <h3>Current Player: {gameState.currentPlayer.toUpperCase()}</h3>
        {gameState.isCheck && <p className="check-warning">⚠️ CHECK!</p>}
        {gameState.isCheckmate && <p className="checkmate-alert">♔ CHECKMATE!</p>}
        {gameState.isStalemate && <p className="stalemate-alert">= STALEMATE</p>}
      </div>

      <div className="move-history">
        <h4>Move History</h4>
        <div className="moves">
          {formatMoveHistory().map((move, index) => (
            <span key={index}>{move}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameInfo;
import React from 'react';
import { PieceType, Color } from '../types/chess.types';
import '../styles/PromotionModal.css';

interface PromotionModalProps {
  isOpen: boolean;
  onSelect: (piece: PieceType) => void;
  playerColor: Color;
}

const PromotionModal: React.FC<PromotionModalProps> = ({ isOpen, onSelect, playerColor }) => {
  const promotionPieces: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];
  const pieces: { [key: string]: string } = {
    'queen-white': '♕',
    'queen-black': '♛',
    'rook-white': '♖',
    'rook-black': '♜',
    'bishop-white': '♗',
    'bishop-black': '♝',
    'knight-white': '♘',
    'knight-black': '♞',
  };

  if (!isOpen) return null;

  return (
    <div className="promotion-overlay">
      <div className="promotion-modal">
        <h2>Choose Promotion Piece</h2>
        <div className="promotion-options">
          {promotionPieces.map((piece) => (
            <button
              key={piece}
              className="promotion-piece"
              onClick={() => onSelect(piece)}
            >
              <span className="piece-symbol">
                {pieces[`${piece}-${playerColor}`]}
              </span>
              <span className="piece-name">{piece.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;
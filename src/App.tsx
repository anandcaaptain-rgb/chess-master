import React, { useState, useEffect } from 'react';
import { ChessEngine } from './engine/ChessEngine';
import { ChessBot } from './ai/ChessBot';
import { P2PManager } from './network/P2PManager';
import ChessBoard from './components/ChessBoard';
import GameInfo from './components/GameInfo';
import GameControls from './components/GameControls';
import PromotionModal from './components/PromotionModal';
import P2PConnection from './components/P2PConnection';
import { Position, GameState, GameMode, Color } from './types/chess.types';
import './styles/App.css';

const App: React.FC = () => {
  const [engine] = useState(() => new ChessEngine());
  const [gameState, setGameState] = useState<GameState>(engine.getGameState());
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  const [bot, setBot] = useState<ChessBot | null>(null);
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Position; to: Position } | null>(null);
  const [playerColor, setPlayerColor] = useState<Color>('white');
  const [p2pManager, setP2PManager] = useState<P2PManager | null>(null);
  const [showP2PConnection, setShowP2PConnection] = useState(false);

  useEffect(() => {
    // Bot moves in PvB mode
    if (gameMode === 'pvbot' && gameState.currentPlayer !== playerColor && !gameState.isCheckmate && !gameState.isStalemate) {
      const timer = setTimeout(() => {
        if (bot) {
          const botMove = bot.getMove();
          if (botMove) {
            handleMoveMade(botMove.from, botMove.to);
          }
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [gameState, gameMode, playerColor, bot]);

  useEffect(() => {
    // P2P move listener
    if (p2pManager && gameMode === 'p2p') {
      p2pManager.onMove((move) => {
        const from: Position = move.from;
        const to: Position = move.to;
        engine.movePiece(from, to, move.promotionPiece);
        setGameState(engine.getGameState());
      });
    }
  }, [p2pManager, gameMode, engine]);

  const handleSquareClick = (position: Position) => {
    engine.selectSquare(position);
    setGameState(engine.getGameState());
  };

  const handleMoveMade = (from: Position, to: Position) => {
    // Check if pawn promotion is needed
    const piece = gameState.board[from.row][from.col];
    if (piece && piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
      setPendingPromotion({ from, to });
      setShowPromotionModal(true);
      return;
    }

    engine.movePiece(from, to);
    const newGameState = engine.getGameState();
    setGameState(newGameState);

    // Send move in P2P mode
    if (gameMode === 'p2p' && p2pManager) {
      p2pManager.sendMove({
        from,
        to,
        piece: gameState.board[from.row][from.col]!,
        capturedPiece: gameState.board[to.row][to.col],
      });
    }
  };

  const handlePromotionSelect = (promotionPiece: string) => {
    if (pendingPromotion) {
      engine.movePiece(pendingPromotion.from, pendingPromotion.to, promotionPiece as any);
      setGameState(engine.getGameState());

      if (gameMode === 'p2p' && p2pManager) {
        p2pManager.sendMove({
          from: pendingPromotion.from,
          to: pendingPromotion.to,
          piece: gameState.board[pendingPromotion.from.row][pendingPromotion.from.col]!,
          isPromotion: true,
          promotionPiece: promotionPiece as any,
        });
      }
    }

    setShowPromotionModal(false);
    setPendingPromotion(null);
  };

  const handleReset = () => {
    engine.resetGame();
    setGameState(engine.getGameState());
    setPlayerColor(gameMode === 'pvbot' ? 'white' : 'white');
    setShowP2PConnection(false);
  };

  const handleUndo = () => {
    engine.undoLastMove();
    setGameState(engine.getGameState());
  };

  const handleModeChange = (mode: GameMode) => {
    if (mode === 'p2p') {
      
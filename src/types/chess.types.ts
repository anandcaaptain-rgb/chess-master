export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type Color = 'white' | 'black';
export type GameMode = 'pvp' | 'pvbot' | 'p2p';

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  type: PieceType;
  color: Color;
  hasMoved?: boolean;
}

export interface Square {
  piece: Piece | null;
  position: Position;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  isEnPassant?: boolean;
  isCastling?: boolean;
  isPromotion?: boolean;
  promotionPiece?: PieceType;
}

export interface GameState {
  board: (Piece | null)[][];
  currentPlayer: Color;
  moveHistory: Move[];
  selectedSquare: Position | null;
  validMoves: Position[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  enPassantTarget: Position | null;
  gameMode: GameMode;
  whiteTime?: number;
  blackTime?: number;
}

export interface P2PMessage {
  type: 'move' | 'chat' | 'draw' | 'resign' | 'start';
  payload: any;
  timestamp: number;
}
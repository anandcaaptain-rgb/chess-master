import { Piece, Position, Move, GameState, Color, PieceType } from '../types/chess.types';

export class ChessEngine {
  private board: (Piece | null)[][];
  private currentPlayer: Color = 'white';
  private moveHistory: Move[] = [];
  private selectedSquare: Position | null = null;
  private validMoves: Position[] = [];
  private enPassantTarget: Position | null = null;
  private whiteCastleKingside: boolean = true;
  private whiteCastleQueenside: boolean = true;
  private blackCastleKingside: boolean = true;
  private blackCastleQueenside: boolean = true;

  constructor() {
    this.board = this.initializeBoard();
  }

  private initializeBoard(): (Piece | null)[][] {
    const board: (Piece | null)[][] = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));

    // Place white pieces
    this.placePiece(board, 0, 0, { type: 'rook', color: 'white', hasMoved: false });
    this.placePiece(board, 0, 1, { type: 'knight', color: 'white', hasMoved: false });
    this.placePiece(board, 0, 2, { type: 'bishop', color: 'white', hasMoved: false });
    this.placePiece(board, 0, 3, { type: 'queen', color: 'white', hasMoved: false });
    this.placePiece(board, 0, 4, { type: 'king', color: 'white', hasMoved: false });
    this.placePiece(board, 0, 5, { type: 'bishop', color: 'white', hasMoved: false });
    this.placePiece(board, 0, 6, { type: 'knight', color: 'white', hasMoved: false });
    this.placePiece(board, 0, 7, { type: 'rook', color: 'white', hasMoved: false });

    for (let col = 0; col < 8; col++) {
      this.placePiece(board, 1, col, { type: 'pawn', color: 'white', hasMoved: false });
    }

    // Place black pieces
    for (let col = 0; col < 8; col++) {
      this.placePiece(board, 6, col, { type: 'pawn', color: 'black', hasMoved: false });
    }

    this.placePiece(board, 7, 0, { type: 'rook', color: 'black', hasMoved: false });
    this.placePiece(board, 7, 1, { type: 'knight', color: 'black', hasMoved: false });
    this.placePiece(board, 7, 2, { type: 'bishop', color: 'black', hasMoved: false });
    this.placePiece(board, 7, 3, { type: 'queen', color: 'black', hasMoved: false });
    this.placePiece(board, 7, 4, { type: 'king', color: 'black', hasMoved: false });
    this.placePiece(board, 7, 5, { type: 'bishop', color: 'black', hasMoved: false });
    this.placePiece(board, 7, 6, { type: 'knight', color: 'black', hasMoved: false });
    this.placePiece(board, 7, 7, { type: 'rook', color: 'black', hasMoved: false });

    return board;
  }

  private placePiece(board: (Piece | null)[][], row: number, col: number, piece: Piece): void {
    if (this.isValidPosition(row, col)) {
      board[row][col] = piece;
    }
  }

  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  public selectSquare(position: Position): Position[] {
    const piece = this.board[position.row][position.col];
    if (piece && piece.color === this.currentPlayer) {
      this.selectedSquare = position;
      this.validMoves = this.getValidMoves(position);
      return this.validMoves;
    }
    return [];
  }

  public movePiece(from: Position, to: Position, promotionPiece?: PieceType): boolean {
    const piece = this.board[from.row][from.col];
    if (!piece) return false;

    const validMoves = this.getValidMoves(from);
    const isValidMove = validMoves.some(m => m.row === to.row && m.col === to.col);

    if (!isValidMove) return false;

    const move: Move = {
      from,
      to,
      piece,
      capturedPiece: this.board[to.row][to.col] || undefined,
    };

    // Handle en passant
    if (piece.type === 'pawn' && Math.abs(from.col - to.col) === 1 && !this.board[to.row][to.col]) {
      move.isEnPassant = true;
      const captureRow = from.row;
      this.board[captureRow][to.col] = null;
    }

    // Handle castling
    if (piece.type === 'king' && Math.abs(from.col - to.col) === 2) {
      move.isCastling = true;
      const rookCol = to.col > from.col ? 7 : 0;
      const rookNewCol = to.col > from.col ? 5 : 3;
      const rook = this.board[from.row][rookCol];
      if (rook) {
        this.board[from.row][rookNewCol] = rook;
        this.board[from.row][rookCol] = null;
        rook.hasMoved = true;
      }
    }

    // Handle pawn promotion
    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
      move.isPromotion = true;
      move.promotionPiece = promotionPiece || 'queen';
      this.board[to.row][to.col] = { type: promotionPiece || 'queen', color: piece.color };
    } else {
      this.board[to.row][to.col] = piece;
    }

    this.board[from.row][from.col] = null;
    piece.hasMoved = true;

    // Update castling rights
    if (piece.type === 'king') {
      if (piece.color === 'white') {
        this.whiteCastleKingside = false;
        this.whiteCastleQueenside = false;
      } else {
        this.blackCastleKingside = false;
        this.blackCastleQueenside = false;
      }
    }

    if (piece.type === 'rook') {
      if (piece.color === 'white') {
        if (from.col === 7) this.whiteCastleKingside = false;
        if (from.col === 0) this.whiteCastleQueenside = false;
      } else {
        if (from.col === 7) this.blackCastleKingside = false;
        if (from.col === 0) this.blackCastleQueenside = false;
      }
    }

    // Set en passant target
    if (piece.type === 'pawn' && Math.abs(from.row - to.row) === 2) {
      this.enPassantTarget = { row: (from.row + to.row) / 2, col: to.col };
    } else {
      this.enPassantTarget = null;
    }

    this.moveHistory.push(move);
    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    this.selectedSquare = null;
    this.validMoves = [];

    return true;
  }

  private getValidMoves(position: Position): Position[] {
    const piece = this.board[position.row][position.col];
    if (!piece) return [];

    let moves: Position[] = [];

    switch (piece.type) {
      case 'pawn':
        moves = this.getPawnMoves(position, piece);
        break;
      case 'rook':
        moves = this.getRookMoves(position, piece);
        break;
      case 'knight':
        moves = this.getKnightMoves(position, piece);
        break;
      case 'bishop':
        moves = this.getBishopMoves(position, piece);
        break;
      case 'queen':
        moves = this.getQueenMoves(position, piece);
        break;
      case 'king':
        moves = this.getKingMoves(position, piece);
        break;
    }

    return moves.filter(move => !this.wouldBeInCheck(position, move, piece.color));
  }

  private getPawnMoves(position: Position, piece: Piece): Position[] {
    const moves: Position[] = [];
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 1 : 6;

    // Forward move
    const oneForward = position.row + direction;
    if (this.isValidPosition(oneForward, position.col) && !this.board[oneForward][position.col]) {
      moves.push({ row: oneForward, col: position.col });

      // Double forward from starting position
      if (position.row === startRow) {
        const twoForward = position.row + direction * 2;
        if (!this.board[twoForward][position.col]) {
          moves.push({ row: twoForward, col: position.col });
        }
      }
    }

    // Captures
    for (let colOffset of [-1, 1]) {
      const newCol = position.col + colOffset;
      const newRow = oneForward;
      if (this.isValidPosition(newRow, newCol)) {
        const targetPiece = this.board[newRow][newCol];
        if (targetPiece && targetPiece.color !== piece.color) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    // En passant
    if (this.enPassantTarget && this.enPassantTarget.row === oneForward) {
      for (let colOffset of [-1, 1]) {
        const newCol = position.col + colOffset;
        if (newCol === this.enPassantTarget.col) {
          moves.push({ row: oneForward, col: newCol });
        }
      }
    }

    return moves;
  }

  private getRookMoves(position: Position, piece: Piece): Position[] {
    const moves: Position[] = [];
    const directions = [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
    ];

    for (const dir of directions) {
      let newRow = position.row + dir.row;
      let newCol = position.col + dir.col;

      while (this.isValidPosition(newRow, newCol)) {
        const target = this.board[newRow][newCol];
        if (!target) {
          moves.push({ row: newRow, col: newCol });
        } else if (target.color !== piece.color) {
          moves.push({ row: newRow, col: newCol });
          break;
        } else {
          break;
        }
        newRow += dir.row;
        newCol += dir.col;
      }
    }

    return moves;
  }

  private getKnightMoves(position: Position, piece: Piece): Position[] {
    const moves: Position[] = [];
    const knightMoves = [
      { row: -2, col: -1 }, { row: -2, col: 1 },
      { row: -1, col: -2 }, { row: -1, col: 2 },
      { row: 1, col: -2 }, { row: 1, col: 2 },
      { row: 2, col: -1 }, { row: 2, col: 1 },
    ];

    for (const move of knightMoves) {
      const newRow = position.row + move.row;
      const newCol = position.col + move.col;

      if (this.isValidPosition(newRow, newCol)) {
        const target = this.board[newRow][newCol];
        if (!target || target.color !== piece.color) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    return moves;
  }

  private getBishopMoves(position: Position, piece: Piece): Position[] {
    const moves: Position[] = [];
    const directions = [
      { row: -1, col: -1 },
      { row: -1, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 1 },
    ];

    for (const dir of directions) {
      let newRow = position.row + dir.row;
      let newCol = position.col + dir.col;

      while (this.isValidPosition(newRow, newCol)) {
        const target = this.board[newRow][newCol];
        if (!target) {
          moves.push({ row: newRow, col: newCol });
        } else if (target.color !== piece.color) {
          moves.push({ row: newRow, col: newCol });
          break;
        } else {
          break;
        }
        newRow += dir.row;
        newCol += dir.col;
      }
    }

    return moves;
  }

  private getQueenMoves(position: Position, piece: Piece): Position[] {
    return [
      ...this.getRookMoves(position, piece),
      ...this.getBishopMoves(position, piece),
    ];
  }

  private getKingMoves(position: Position, piece: Piece): Position[] {
    const moves: Position[] = [];
    const directions = [
      { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
      { row: 0, col: -1 }, { row: 0, col: 1 },
      { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 },
    ];

    for (const dir of directions) {
      const newRow = position.row + dir.row;
      const newCol = position.col + dir.col;

      if (this.isValidPosition(newRow, newCol)) {
        const target = this.board[newRow][newCol];
        if (!target || target.color !== piece.color) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    // Castling
    if (!this.isInCheck(piece.color)) {
      if (piece.color === 'white') {
        if (this.whiteCastleKingside && !this.board[0][5] && !this.board[0][6]) {
          const rook = this.board[0][7];
          if (rook && rook.type === 'rook' && !rook.hasMoved) {
            moves.push({ row: 0, col: 6 });
          }
        }
        if (this.whiteCastleQueenside && !this.board[0][1] && !this.board[0][2] && !this.board[0][3]) {
          const rook = this.board[0][0];
          if (rook && rook.type === 'rook' && !rook.hasMoved) {
            moves.push({ row: 0, col: 2 });
          }
        }
      } else {
        if (this.blackCastleKingside && !this.board[7][5] && !this.board[7][6]) {
          const rook = this.board[7][7];
          if (rook && rook.type === 'rook' && !rook.hasMoved) {
            moves.push({ row: 7, col: 6 });
          }
        }
        if (this.blackCastleQueenside && !this.board[7][1] && !this.board[7][2] && !this.board[7][3]) {
          const rook = this.board[7][0];
          if (rook && rook.type === 'rook' && !rook.hasMoved) {
            moves.push({ row: 7, col: 2 });
          }
        }
      }
    }

    return moves;
  }

  private isInCheck(color: Color): boolean {
    const kingPos = this.findKing(color);
    if (!kingPos) return false;

    const opponentColor = color === 'white' ? 'black' : 'white';
    return this.isSquareUnderAttack(kingPos, opponentColor);
  }

  private isSquareUnderAttack(position: Position, byColor: Color): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === byColor) {
          const moves = this.getValidMovesWithoutCheckTest({ row, col });
          if (moves.some(m => m.row === position.row && m.col === position.col)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private getValidMovesWithoutCheckTest(position: Position): Position[] {
    const piece = this.board[position.row][position.col];
    if (!piece) return [];

    let moves: Position[] = [];

    switch (piece.type) {
      case 'pawn':
        moves = this.getPawnMoves(position, piece);
        break;
      case 'rook':
        moves = this.getRookMoves(position, piece);
        break;
      case 'knight':
        moves = this.getKnightMoves(position, piece);
        break;
      case 'bishop':
        moves = this.getBishopMoves(position, piece);
        break;
      case 'queen':
        moves = this.getQueenMoves(position, piece);
        break;
      case 'king':
        moves = this.getKingMovesWithoutCastling(position, piece);
        break;
    }

    return moves;
  }

  private getKingMovesWithoutCastling(position: Position, piece: Piece): Position[] {
    const moves: Position[] = [];
    const directions = [
      { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
      { row: 0, col: -1 }, { row: 0, col: 1 },
      { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 },
    ];

    for (const dir of directions) {
      const newRow = position.row + dir.row;
      const newCol = position.col + dir.col;

      if (this.isValidPosition(newRow, newCol)) {
        const target = this.board[newRow][newCol];
        if (!target || target.color !== piece.color) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    return moves;
  }

  private wouldBeInCheck(from: Position, to: Position, color: Color): boolean {
    const piece = this.board[from.row][from.col];
    const captured = this.board[to.row][to.col];

    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = null;

    const inCheck = this.isInCheck(color);

    this.board[from.row][from.col] = piece;
    this.board[to.row][to.col] = captured;

    return inCheck;
  }

  private findKing(color: Color): Position | null {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  }

  public getGameState(): GameState {
    return {
      board: this.board.map(row => [...row]),
      currentPlayer: this.currentPlayer,
      moveHistory: [...this.moveHistory],
      selectedSquare: this.selectedSquare,
      validMoves: this.validMoves,
      isCheck: this.isInCheck(this.currentPlayer),
      isCheckmate: this.isCheckmate(),
      isStalemate: this.isStalemate(),
      enPassantTarget: this.enPassantTarget,
      gameMode: 'pvp',
    };
  }

  private isCheckmate(): boolean {
    if (!this.isInCheck(this.currentPlayer)) return false;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === this.currentPlayer) {
          const moves = this.getValidMoves({ row, col });
          if (moves.length > 0) return false;
        }
      }
    }
    return true;
  }

  private isStalemate(): boolean {
    if (this.isInCheck(this.currentPlayer)) return false;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === this.currentPlayer) {
          const moves = this.getValidMoves({ row, col });
          if (moves.length > 0) return false;
        }
      }
    }
    return true;
  }

  public resetGame(): void {
    this.board = this.initializeBoard();
    this.currentPlayer = 'white';
    this.moveHistory = [];
    this.selectedSquare = null;
    this.validMoves = [];
    this.enPassantTarget = null;
    this.whiteCastleKingside = true;
    this.whiteCastleQueenside = true;
    this.blackCastleKingside = true;
    this.blackCastleQueenside = true;
  }

  public undoLastMove(): void {
    if (this.moveHistory.length === 0) return;

    const lastMove = this.moveHistory.pop();
    if (!lastMove) return;

    this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
    this.board[lastMove.to.row][lastMove.to.col] = lastMove.capturedPiece || null;

    if (lastMove.isCastling) {
      const rookCol = lastMove.to.col > lastMove.from.col ? 7 : 0;
      const rookNewCol = lastMove.to.col > lastMove.from.col ? 5 : 3;
      const rook = this.board[lastMove.from.row][rookNewCol];
      if (rook) {
        this.board[lastMove.from.row][rookCol] = rook;
        this.board[lastMove.from.row][rookNewCol] = null;
      }
    }

    if (lastMove.isEnPassant) {
      const captureRow = lastMove.from.row;
      const captureCol = lastMove.to.col;
      this.board[captureRow][captureCol] = {
        type: 'pawn',
        color: this.currentPlayer === 'white' ? 'black' : 'white',
      };
    }

    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    this.selectedSquare = null;
    this.validMoves = [];
  }
}
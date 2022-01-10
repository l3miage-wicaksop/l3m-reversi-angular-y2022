import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Board, BoardtoString, Board_RO, C, charToTurn, GameState, getEmptyBoard, PlayImpact, ReversiModelInterface, TileCoords, Turn } from './ReversiDefinitions';

@Injectable({
  providedIn: 'root'
})
export class ReversiGameEngineService implements ReversiModelInterface {
  // NE PAS MODIFIER
  protected _board: Board = getEmptyBoard();
  protected currentTurn: Turn = 'Player1';
  protected gameStateSubj = new BehaviorSubject<GameState>({
    board: this._board,
    turn: this.currentTurn
  });
  public readonly gameStateObs: Observable<GameState> = this.gameStateSubj.asObservable();

  // NE PAS MODIFIER
  constructor() {
      this.restart();
      // NE PAS TOUCHER, POUR LE SEBUG DANS LA CONSOLE
      (window as any).RGS = this;
      console.log("Utilisez RGS pour accéder à l'instance de service ReversiGameEngineService.\nExemple : RGS.résuméDebug()")
  }

  résuméDebug(): void {
    console.log( `________
${BoardtoString(this.board)}
________
Au tour de ${this.turn}
X représente ${charToTurn('X')}
O représente ${charToTurn('O')}
________
Coups possibles (${this.whereCanPlay().length}) :
${this.whereCanPlay().map( P => `  * ${P}`).join("\n")}
    `);
  }

  // NE PAS MODIFIER
  get turn(): Turn {
    return this.currentTurn;
  }

  get board(): Board_RO {
    return this._board;
  }

  // NE PAS MODIFIER
  restart(board?: Board_RO, turn?: Turn): void {
      this.initBoard();
      if (!!board) {
        this._board = board.map( L => L.map( c => c) ) as Board;
      }
      if (!!turn) {
        this.currentTurn = turn;
      }
      this.gameStateSubj.next({
        turn: this.currentTurn,
        board: this._board
      });
  }

  // NE PAS MODIFIER
  play(i: number, j: number): void {
    const b = this._board;
    this.tryPlay(i, j);
    if (b !== this._board) {
      this.gameStateSubj.next({
        turn: this.currentTurn,
        board: this._board
      });
    }
  }

  //__________________________________________ MODIFICATIONS ICI __________________________________________
  /**
   * Renvoie la liste des positions qui seront prises si on pose un pion du joueur courant en position i,j
   * @param i Indice de la ligne où poser le pion
   * @param j Indice de la colonne où poser le pion
   * @returns Une liste des positions qui seront prise si le pion est posée en x,y
   */
  PionsTakenIfPlayAt(i: number, j: number): PlayImpact {
      return [];
  }

  /**
   * Liste les positions pour lesquels le joueur courant pourra prendre des pions adverse.
   * Il s'agit donc des coups possibles pour le joueur courant.
   * @returns liste des positions jouables par le joueur courant.
   */
  whereCanPlay(): readonly TileCoords[] {
    return [];
  }

  /**
   * Le joueur courant pose un pion en i,j.
   * Si le coup n'est pas possible (aucune position de prise), alors le pion n'est pas joué et le tour ne change pas.
   * Sinon les positions sont prises et le tour de jeu change.
   * @param i L'indice de la ligne où poser le pion.
   * @param j L'indice de la colonen où poser le pion.
   */
  private tryPlay(i: number, j: number): void {
  }

  /**
   * initBoard initialise un nouveau plateau à l'état initiale (2 pions de chaque couleurs).\
   * Initialise aussi le joueur courant.
   */
  private initBoard(): void {
  }

}

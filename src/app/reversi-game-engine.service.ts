import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, OperatorFunction, share } from 'rxjs';
import { Board, BoardtoString, Board_RO, C, charToTurn, GameState, getEmptyBoard, PlayImpact, ReversiModelInterface, TileCoords, Turn } from './ReversiDefinitions';

export function runInZone<T>(zone: NgZone): OperatorFunction<T, T> {
  return (source) => {
    return new Observable(observer => {
      const next     = (value: T)   => zone.run(() => observer.next(value));
      const error    = (e: unknown) => zone.run(() => observer.error(e)   );
      const complete = ()           => zone.run(() => observer.complete() );
      return source.subscribe({next, error, complete});
    });
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReversiGameEngineService implements ReversiModelInterface {
  // NE PAS MODIFIER
  protected gameStateSubj = new BehaviorSubject<GameState>({
    board: getEmptyBoard(),
    turn: 'Player1'
  });
  public readonly gameStateObs: Observable<GameState> = this.gameStateSubj.asObservable();

  // NE PAS MODIFIER
  constructor(private ngz: NgZone) {
      this.restart();
      this.gameStateObs = this.gameStateSubj.asObservable().pipe(
        runInZone(ngz),
        share({
          connector: () => new BehaviorSubject( this.gameStateSubj.value )
        })
      );
      // NE PAS TOUCHER, POUR LE DEBUG DANS LA CONSOLE
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
    return this.gameStateSubj.value.turn;
  }

  get board(): Board_RO {
    return this.gameStateSubj.value.board;
  }

  // NE PAS MODIFIER
  restart( {turn, board}: Partial<GameState> = {} ): void {
      const gs = this.initGameState();
      let newBoard: Board;
      let newTurn: Turn;

      newBoard = !!board ? board.map( L => [...L] ) as Board : gs.board as Board;
      newTurn = turn ?? gs.turn;

      this.gameStateSubj.next({
        turn: newTurn,
        board: newBoard
      });
  }

  // NE PAS MODIFIER
  play(i: number, j: number): void {
    const {board: b1, turn: t1} = this.gameStateSubj.value;
    const {board: b2, turn: t2} = this.tryPlay(i, j);
    if (b1 !== b2 || t1 !== t2) {
      this.gameStateSubj.next({
        turn: t2,
        board: b2
      });
      if (!this.canPlay()) {
        this.gameStateSubj.next({
          turn: t2 === 'Player1' ? 'Player2' : 'Player1',
          board: b2
        });
      }
    }
  }

  //_______________________________________________________________________________________________________
  //__________________________________________ MODIFICATIONS ICI __________________________________________
  //_______________________________________________________________________________________________________

  /**
   * initGameState initialise un nouveau plateau à l'état initiale (2 pions de chaque couleurs).\
   * Initialise aussi le joueur courant.
   * @returns L'état initiale du jeu, avec les 4 pions initiaux bien placés.
   */
  private initGameState(): GameState {
    let tmpBoard = getEmptyBoard()

    tmpBoard[3][3] = tmpBoard[4][4] = 'Player2'
    tmpBoard[4][3] = tmpBoard[3][4] = 'Player1'
     

    // return {turn: this.turn, board: this.board};
    return {turn: 'Player1', board: tmpBoard};
  }



  /**
   * Renvoie la liste des positions qui seront prises si on pose un pion du joueur courant en position i,j
   * @param i Indice de la ligne où poser le pion
   * @param j Indice de la colonne où poser le pion
   * @returns Une liste des positions qui seront prise si le pion est posée en x,y
   */
  PionsTakenIfPlayAt(i: number, j: number): PlayImpact {
    
      let lst:PlayImpact = [];
      let opponent:Turn = this.turn === 'Player1' ? 'Player2' : 'Player1'
      let directionMatrix = [[1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1] ]

      directionMatrix.forEach(([dx,dy]) =>
        {
          let tmpLst: TileCoords[] =[];
          let x:number = i
          let y:number = j
          while((x >=0 && x < 8) && (y>=0 && y<8) && this.board[i]?.[j] === 'Empty'){ // on peut mettre un pion que dans une case vide et dans le tableau (de taille 8x8)
           
            x += dx;
            y += dy;
            
            if(this.board[x]?.[y] === 'Empty' ) break; // pas besoin de verifier les directions vide

            if (this.board[x]?.[y] === opponent && this.board[x]?.[y] !== this.turn ) tmpLst.push([x,y]) // ajoute les pions adversaires

            if(this.board[x]?.[y] === this.turn && tmpLst.length>0){
              lst = lst.concat(tmpLst) ; 
              break; // si on a trouvé le pion de notre
            } 
              
          }
        }
      )
    
      return lst;
  }

  /**
   * Liste les positions pour lesquels le joueur courant pourra prendre des pions adverse.
   * Il s'agit donc des coups possibles pour le joueur courant.
   * @returns liste des positions jouables par le joueur courant.
   */
  whereCanPlay(): readonly TileCoords[] {
    const L: TileCoords[] = [];
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        if (this.PionsTakenIfPlayAt(i, j).length > 0) {
          
          L.push( [i, j] );
        }
      }
    }
    
    return L;
  }

  /**
   * Le joueur courant pose un pion en i,j.
   * Si le coup n'est pas possible (aucune position de prise), alors le pion n'est pas joué et le tour ne change pas.
   * Sinon les positions sont prises et le tour de jeu change.
   * @param i L'indice de la ligne où poser le pion.
   * @param j L'indice de la colonen où poser le pion.
   * @returns Le nouvel état de jeu si le joueur courant joue en i,j, l'ancien état si il ne peut pas jouer en i,j
   */
  private tryPlay(i: number, j: number): GameState {
    
    let placesPossibles = this.PionsTakenIfPlayAt(i,j)
    let opponent:Turn = this.turn === 'Player1' ? 'Player2' : 'Player1'
    let nextBoard:Board = this.board.map( e => e.slice() ) as Board;

    nextBoard[i][j] = this.turn

    if(placesPossibles.length > 0){
      placesPossibles.forEach(([di,dj]) => {
        nextBoard[di][dj] = this.turn
      })
      return {turn: opponent, board: nextBoard}
    } 
    
    return {turn: this.turn , board: this.board}
    
    
    
    
  }

  /**
   * @returns vrai si le joueur courant peut jouer quelque part, faux sinon.
   */
  private canPlay(): boolean {
      return this.whereCanPlay().length > 0;
  }
}

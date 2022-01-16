import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Board, BoardtoString, Board_RO, C, charToTurn, cToString, GameState, getEmptyBoard, PlayImpact, ReversiModelInterface, TileCoords, Turn } from './ReversiDefinitions';

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
  constructor() {
      this.restart();
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
    return {turn: this.turn, board: tmpBoard};
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

      for(let dir = 0 ; dir<8; dir++){ // il s'agit de 8 directions possible
        let tmpLst: TileCoords[] =[];
        
        let dx = i;
        let dy = j;

        
        while( (dx>=0 && dx < 8) && (dy>=0 && dy<8) ){ // pour ne pas depasser les bords
          switch(dir){
            case 0:  // case 0 : droite
              dx++;
              break;
            case 1 : // case 1 : droite bas
              dx++;
              dy++;
              break;
            case 2 : // case 2 : bas
              dy++;
              break;
            case 3: // case 3 : bas gauche
              dy++;
              dx--;
              break;
            case 4: // case 4 : gauche
              dx--;
              break;
            case 5: // case 5 : haute gauche
              dx--;
              dy--;
              break;
            case 6: // case 6 : haute
              dy--;
              break;
            case 7: // case 7 : haute droite
              dx++;
              dy--;
              break;
          }

          if(this.board[dx]?.[dy] === 'Empty') break; // pas besoin de verifier les directions vide
          
          
          if (this.board[dx]?.[dy] === opponent && this.board[dx][dy] !== 'Empty') tmpLst.push([dx,dy]) // ajoute les pions adversaires

          if(this.board[dx]?.[dy] === this.turn && tmpLst.length>0){
            lst = lst.concat(tmpLst) ; 
            break; // si on a trouvé le pion de notre
          } 
          

        }
        console.log("voici la liste tmp: " + tmpLst)
        
        
      }
      
      console.log("liste finale" + lst)
      
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
    return {turn: this.turn, board: this.board};
  }

  /**
   * @returns vrai si le joueur courant peut jouer quelque part, faux sinon.
   */
  private canPlay(): boolean {
      return false;
  }
}

import { Injectable } from '@angular/core';
import { delay, filter } from 'rxjs/operators';
import { ReversiGameEngineService } from './reversi-game-engine.service';

@Injectable({
  providedIn: 'root'
})
export class IaService {

  constructor(RGS:ReversiGameEngineService) { 
    console.log("IA Crée")
    
 
    
    RGS.gameStateObs.pipe(delay(500), filter(n=>n.turn === 'Player1')).subscribe(()=>{
      if(RGS.whereCanPlay().length>0){
        let randomCasePicked = RGS.whereCanPlay()[Math.floor(Math.random() * RGS.whereCanPlay.length)]
      RGS.play(randomCasePicked[0], randomCasePicked[1])
      RGS.résuméDebug()
      }
      

    })
   
  }
  
  
}

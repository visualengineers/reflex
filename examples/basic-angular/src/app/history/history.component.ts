import { Component, OnDestroy, OnInit } from '@angular/core';
import { TouchPointService } from 'src/services/touch-point.service';
import { InteractionFrame } from '@reflex/shared-types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent  implements OnInit, OnDestroy {
  private _frames: Subscription | undefined;

  public Frames: Array<InteractionFrame> = [];
  public JSON: JSON;

  constructor(private _pointService: TouchPointService) {
    this.JSON = JSON;
   }

  ngOnInit(): void {
    this._frames = this._pointService.getHistory().subscribe(res => {
      this.Frames = res;
    });
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this._frames?.unsubscribe();    
  }

}

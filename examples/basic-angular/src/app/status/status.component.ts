import { Component, OnDestroy, OnInit } from '@angular/core';
import { Interaction } from '@reflex/shared-types';
import { interval, Observable, Subscription } from 'rxjs';
import { TouchPointService } from 'src/services/touch-point.service';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss']
})
export class StatusComponent implements OnInit, OnDestroy {

  _touchPoints$: Observable<Interaction[]> | undefined;
  _touchPointSubscription: Subscription| undefined;

  _connectionSubscription: Subscription | undefined;

  public WebSocketAddress = "";
  public IsConnected = false;
  public FrameNumber = 0;
  public TouchCount = 0;

  constructor(private _pointService: TouchPointService) { }

  ngOnInit(): void {
    this._touchPoints$ = this._pointService.getTouchPoints();
    this._touchPointSubscription = this._touchPoints$.subscribe(res => {
      this.FrameNumber++;
      this.TouchCount = res.length;      
    });
    interval(500).subscribe(() => this.IsConnected = this._pointService.isConnected());
    console.log(this.IsConnected);
    this.WebSocketAddress = this._pointService.getAddress();
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this._touchPointSubscription?.unsubscribe();
    this._connectionSubscription?.unsubscribe();
    
  }


}

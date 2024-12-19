import { Component, ElementRef, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { DepthCameraState } from '@reflex/shared-types';
import { BehaviorSubject, NEVER, Observable, Subscription, combineLatest, Subject } from 'rxjs';
import { distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { TrackingService } from 'src/shared/services/tracking.service';
import { WebSocketService } from 'src/shared/services/webSocket.service';

@Component({
    selector: 'app-depth-image',
    templateUrl: './depth-image.component.html',
    styleUrls: ['./depth-image.component.scss'],
    standalone: false
})
export class DepthImageComponent implements OnInit, OnDestroy {

  private static readonly fullScreenClassName = 'fullScreen';

  @ViewChild('depthImageRenderContainer')
  public container?: ElementRef;

  @Output()
  public fullScreenChanged = new EventEmitter<boolean>();

  public imageData = '';

  public livePreview = false;
  public numFramesReceived = 0;

  private pfullScreen = false;

  private readonly livePreview$ = new BehaviorSubject<boolean>(false);

  private readonly shouldShowLiveView$: Observable<boolean>;

  private plivePreviewEnabled = false;

  private depthImageSubscription?: Subscription;

  private readonly address = 'depthImage';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private socket?: Subject<MessageEvent>;

  // eslint-disable-next-line new-cap
  public constructor(@Inject('BASE_URL') private readonly baseUrl: string, private readonly angularRenderer: Renderer2, private readonly wsService: WebSocketService, private readonly trackingService: TrackingService) {

    this.baseUrl = this.baseUrl.replace('http', 'ws');

    const isTracking$ = this.trackingService.getStatus()
      .pipe(
        map((status) => status.depthCameraStateName === DepthCameraState[DepthCameraState.Streaming]),
        distinctUntilChanged()
      );

    this.shouldShowLiveView$ = combineLatest(isTracking$, this.livePreview$)
      .pipe(
        tap(([isTracking, livePreview]) => {
          console.debug(`tracking: ${isTracking}, livePreview: ${livePreview}`);

        }),
        map(([isTracking, livePreview]) => livePreview && isTracking)
      );
  }

  public get fullScreen(): boolean {
    return this.pfullScreen;
  }

  public set fullScreen(fs: boolean) {
    this.pfullScreen = fs;
    this.fullScreenChanged.emit(this.pfullScreen);
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public get livePreviewEnabled(): boolean {
    return this.plivePreviewEnabled;
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  @Input()
  public set livePreviewEnabled(value: boolean) {
    this.plivePreviewEnabled = value;

    if (!value) {
      this.numFramesReceived = 0;
    }

    if (!this.plivePreviewEnabled && this.livePreview) {
      this.livePreview = false;
      this.livePreviewChanged();
    }
  }


  public ngOnInit(): void {
    this.depthImageSubscription = this.shouldShowLiveView$
      .pipe(
        switchMap((showLiveView) => {
          if (showLiveView) {
            return this.startSocket();
          } else {
            this.stopSocket();
          }

          return NEVER.pipe();
        }),
        tap((result) => {
          if (result.data !== undefined && result.data !== null) {
            this.numFramesReceived++;
          }
        })
      )
      .subscribe(
        (result) => this.updateDepthImage(result),
        (error) => console.error(error)
      );
  }

  public ngOnDestroy(): void {
    this.depthImageSubscription?.unsubscribe();
  }

  public livePreviewChanged(): void {
    this.livePreview$.next(this.livePreview);
    this.trackingService.setDepthImagePreviewState(this.livePreview).subscribe(
      () => this.livePreview$.next(this.livePreview)
    );
  }

  public updateSize(): void {

    if (this.container === undefined) {
      return;
    }

    if (this.fullScreen) {
      this.angularRenderer.addClass(this.container.nativeElement, DepthImageComponent.fullScreenClassName);
    } else {
      this.angularRenderer.removeClass(this.container.nativeElement, DepthImageComponent.fullScreenClassName);
    }
  }

  private startSocket(): Observable<MessageEvent> {
    this.socket = this.wsService.createSocket({
      url: `${this.baseUrl}${this.address}`,
      deserializer: (value) => value
    });

    // this._socket = webSocket({
    //   url: `${this.baseUrl}${this._address}`,
    //   deserializer: (value) => value
    // });

    this.socket.next(new MessageEvent('message', { data: 'Start' }));

    return this.wsService.getResponseStream();
  }

  private stopSocket(): void {
    if (this.socket) {
      this.socket.complete();
    }
  }

  private updateDepthImage(result: MessageEvent): void {
    if (result.data === undefined || result.data === null) {
      return;
    }

    this.imageData = result.data as string;

    this.socket?.next(new MessageEvent('message', { data: 'continue' }));
  }

}

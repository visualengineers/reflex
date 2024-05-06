import { Injectable, OnDestroy } from "@angular/core";
import { BACKGROUND_SOURCES } from "../data/backgroundSources";
import { BackgroundSource } from "../model/BackgroundSource.model";
import { CAMERAS } from "../data/cameras";
import { NormalizedPoint } from "../model/NormalizedPoint.model";
import { Observable, Subject, BehaviorSubject } from "rxjs";

export interface Camera {
  model: string;
  resolution: string;
  version?: number;
}

export interface CircleSize {
  min: number;
  max: number;
}

export interface Layers {
  up: number;
  down: number;
  colorUp?: string;
  colorDown?: string;
}

export interface ViewOption {
  option: string;
  active: boolean;
}

export interface ViewPort {
  width: number;
  heigth: number;
}

@Injectable({
  providedIn: "root",
})
export class ConfigurationService implements OnDestroy {
  public activePoint$ = new Subject<number>();
  public amountTouchPoints$ = new BehaviorSubject<number>(3);
  public background$ = new Subject();
  public backupTimestamp$ = new BehaviorSubject<Date | null>(null);
  public layers$ = new BehaviorSubject<Layers>({
    up: 2,
    down: 7,
    colorUp: "#b9a14b",
    colorDown: "#111722",
  });
  public normalizedPoints$ = new BehaviorSubject<NormalizedPoint[]>([]);

  private amountProjectionLayers: number;
  private backgroundImage: string;
  private backgroundSources: BackgroundSource[];
  private camera: Camera;
  private circleSize: CircleSize;
  private sendInterval: number;
  private serverConnection: string;
  private viewOptions: ViewOption[];
  private viewPort: ViewPort;

  constructor() {
    this.amountProjectionLayers = 7;
    this.backgroundImage = "";
    this.backgroundSources = BACKGROUND_SOURCES;
    (this.camera = {
      model: "Azure Kinect DK",
      resolution: "640 × 576",
    }),
      (this.circleSize = {
        min: 20,
        max: 400,
      });
    this.sendInterval = 100;
    this.serverConnection = "ws://127.0.0.1:40000/ReFlex";
    this.viewOptions = [
      { option: "Contours", active: false },
      { option: "Depth Image", active: false },
      { option: "Extrema", active: true },
      { option: "Vectors", active: false },
    ];
    this.viewPort = {
      width: 640,
      height: 480,
    };

    this.setBackupTimestamp();
  }

  getActivePoint(): Observable<number> {}

  setActivePoint(point: number): void {}

  getAmountProjectionLayers(): number {}

  getAmountTouchPoints(): Observable<number> {}

  setAmoutTouchPoints(amountTouchPoints: number): void {}

  getBackgroundImage(): string {}

  setBackgroundImage(backgroundImage: string): void {}

  getBackgroundSources(): BackgroundSource[] {}

  setBackgroundSources(paths: BackgroundSource[]): void {}

  getBackupTimestamp(): Observable<Date | null> {}

  setBackupTimestamp(): void {}

  getCamera(): Camera {}

  setCamera(camera: Camera): void {}

  getCameraOptions(): Camera[] {}

  getCircleSize(): CircleSize {}

  setCircleSize(circleSize: CircleSize): void {}

  getLayers(layers: Layers): void {}

  setLayers(layers: Layers): void {}

  getNormalizedPoints(): Observable<NormalizedPoint[]> {}

  setNormalizedPoints(normalizedPoints: NormalizedPoint[]): void {}

  getSendInterval(): number {}

  setSendInterval(sendInterval: number): void {}

  getServerConnection(): string {}

  setServerConnection(serverConnection: string): void {}

  getViewOptions(): ViewOption[] {}

  setViewOption(viewOptions: ViewOption[]): void {}

  getViewPort(): ViewPort {}

  setViewPort(viewPort: ViewPort): void {}

  getLocalStorage(): void {}

  setLocalStorage(): void {}

  clearLocalStorage(): void {}

  ngOnDestroy() {}
}

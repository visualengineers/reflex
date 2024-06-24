import { Injectable, OnDestroy, Inject } from "@angular/core";
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
  height: number;
}

@Injectable({
  providedIn: "root",
})
export class ConfigurationService implements OnDestroy {
  public activePoint$ = new Subject<number>();
  public amountTouchPoints$ = new BehaviorSubject<number>(10);
  public background$ = new Subject();
  public backupTimestamp$ = new BehaviorSubject<Date | null>(null);
  public layers$ = new BehaviorSubject<Layers>({
    up: 2,
    down: 7,
    colorUp: "#0071B7",
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
    this.backgroundImage = '';
    this.backgroundSources = BACKGROUND_SOURCES;
    (this.camera = {
      model: "Azure Kinect DK",
      resolution: "640 × 576",
    }),
      (this.circleSize = {
        min: 20,
        max: 150,
      });
    this.sendInterval = 100;
    this.serverConnection = "ws://127.0.0.1:30000/Recorder";
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

  getActivePoint(): Observable<number> {
    return this.activePoint$.asObservable();
  }

  setActivePoint(point: number): void {
    this.activePoint$.next(point);
  }

  getAmountProjectionLayers(): number {
    return this.amountProjectionLayers;
  }

  setAmountProjectionLayers(amountProjectionLayers: number): void {
    this.amountProjectionLayers = amountProjectionLayers;
  }

  getAmountTouchPoints(): Observable<number> {
    return this.amountTouchPoints$.asObservable();
  }

  setAmoutTouchPoints(amountTouchPoints: number): void {
    this.amountTouchPoints$.next(amountTouchPoints);
  }

  getBackgroundImage(): string {
    return this.backgroundImage;
  }

  setBackgroundImage(backgroundImage: string): void {
    this.backgroundImage = backgroundImage;
    console.log("BackgroundImage:",this.backgroundImage);
    this.background$.next(this.backgroundImage);
    console.log("Background:",this.background$);
  }

  getBackgroundSources(): BackgroundSource[] {
    return this.backgroundSources;
  }

  setBackgroundSources(paths: BackgroundSource[]): void {
    this.backgroundSources = paths;
  }

  getBackupTimestamp(): Observable<Date | null> {
    return this.backupTimestamp$.asObservable();
  }

  setBackupTimestamp(): void {
    let timestamp: Date | null = null;
    const settings = localStorage.getItem("Gestenrecorder Settings");

    try {
      if (settings != null) {
        timestamp = JSON.parse(settings)?.BACKUP_TIMESTAMP as Date;
      }
    } catch (e) {
      timestamp = null;
    }

    this.backupTimestamp$.next(timestamp);
  }

  getCamera(): Camera {
    return this.camera;
  }

  setCamera(camera: Camera): void {
    this.camera = camera;
  }

  getCameraOptions(): Camera[] {
    return CAMERAS;
  }

  getCircleSize(): CircleSize {
    return this.circleSize;
  }

  setCircleSize(circleSize: CircleSize): void {
    this.circleSize = circleSize;
  }

  getLayers(): Observable<Layers> {
    return this.layers$.asObservable();
  }

  setLayers(layers: Layers): void {
    this.layers$.next(layers);
  }

  getNormalizedPoints(): Observable<NormalizedPoint[]> {
    return this.normalizedPoints$.asObservable();
  }

  setNormalizedPoints(normalizedPoints: NormalizedPoint[]): void {
    this.normalizedPoints$.next(normalizedPoints);
  }

  getSendInterval(): number {
    return this.sendInterval;
  }

  setSendInterval(sendInterval: number): void {
    this.sendInterval = sendInterval;
  }

  getServerConnection(): string {
    return this.serverConnection;
  }

  setServerConnection(serverConnection: string): void {
    this.serverConnection = serverConnection;
  }

  getViewOptions(): ViewOption[] {
    return this.viewOptions;
  }

  setViewOptions(viewOptions: ViewOption[]): void {
    this.viewOptions = viewOptions;
  }

  getViewPort(): ViewPort {
    return this.viewPort;
  }

  setViewPort(viewPort: ViewPort): void {
    this.viewPort = viewPort;
  }

  getLocalStorage(): void {
    const storageSettings = localStorage.getItem('Gestenrecorder Settings');
    if (storageSettings === null) {
      return;
    }
    const settings = JSON.parse(storageSettings);

    this.setAmountProjectionLayers(settings.amountProjectionLayers);
    this.setAmoutTouchPoints(settings.amountTouchPoints);
    this.setBackgroundImage(settings.backgroundImage);
    this.setBackgroundSources(settings.backgroundSources);
    this.setCamera(settings.camera);
    this.setCircleSize(settings.circleSize);
    this.setLayers(settings.layers);
    this.setNormalizedPoints(settings.normalizedPoints);
    this.setSendInterval(settings.sendInterval);
    this.setServerConnection(settings.serverConnection);
    this.setViewOptions(settings.viewOptions);
    this.setViewPort(settings.viewPort);
  }

  setLocalStorage(): void {
    const amountTouchPoints = this.amountTouchPoints$.getValue();
    const layers = this.layers$.getValue();
    const normalizedPoints = this.normalizedPoints$.getValue();

    const settings = {
      BACKUP_TIMESTAMP: new Date().toLocaleString("de-DE"),
      amountProjectionLayers: this.amountProjectionLayers,
      amountTouchPoints,
      backgroundImage: this.backgroundImage,
      backgroundSources: this.backgroundSources,
      camera: this.camera,
      circleSize: this.circleSize,
      layers,
      normalizedPoints,
      sendInterval: this.sendInterval,
      serverConnection: this.serverConnection,
      viewOptions: this.viewOptions,
      viewPort: this.viewPort,
    };

    localStorage.setItem(
      "Gestenrecorder Settings",
      JSON.stringify(settings),
    );
    this.setBackupTimestamp();
  }

  clearLocalStorage(): void {
    localStorage.clear;
  }

  ngOnDestroy() {
    this.amountTouchPoints$.unsubscribe();
    this.backupTimestamp$.unsubscribe();
    this.layers$.unsubscribe();
    this.normalizedPoints$.unsubscribe();
  }
}

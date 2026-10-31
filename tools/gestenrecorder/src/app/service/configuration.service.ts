import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { BACKGROUND_SOURCES } from '../data/backgroundSources';
import { CAMERAS } from '../data/cameras';
import { BackgroundSource } from '../model/BackgroundSource.model';
import { NormalizedPoint } from '../model/NormalizedPoint.model';

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

interface StoredSettings {
  BACKUP_TIMESTAMP: string;
  amountProjectionLayers: number;
  amountTouchPoints: number;
  backgroundImage: string;
  backgroundSources: Array<BackgroundSource>;
  camera: Camera;
  circleSize: CircleSize;
  layers: Layers;
  normalizedPoints: Array<NormalizedPoint>;
  sendInterval: number;
  serverConnection: string;
  viewOptions: Array<ViewOption>;
  viewPort: ViewPort;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService implements OnDestroy {
  public activePoint$ = new Subject<number>();
  public amountTouchPoints$ = new BehaviorSubject<number>(10);
  public background$ = new Subject();
  public backupTimestamp$ = new BehaviorSubject<Date | null>(null);
  public layers$ = new BehaviorSubject<Layers>({
    up: 2,
    down: 7,
    colorUp: '#0071B7',
    colorDown: '#111722'
  });

  public normalizedPoints$ = new BehaviorSubject<Array<NormalizedPoint>>([]);

  private amountProjectionLayers: number;
  private backgroundImage: string;
  private backgroundSources: Array<BackgroundSource>;
  private camera: Camera;
  private circleSize: CircleSize;
  private sendInterval: number;
  private serverConnection: string;
  private viewOptions: Array<ViewOption>;
  private viewPort: ViewPort;

  public constructor() {
    this.amountProjectionLayers = 7;
    this.backgroundImage = '';
    this.backgroundSources = BACKGROUND_SOURCES;
    this.camera = {
      model: 'Azure Kinect DK',
      resolution: '640 × 576'
    };
    this.circleSize = {
      min: 20,
      max: 150
    };
    this.sendInterval = 100;
    this.serverConnection = 'ws://127.0.0.1:30000/Recorder';
    this.viewOptions = [
      { option: 'Contours', active: false },
      { option: 'Depth Image', active: false },
      { option: 'Extrema', active: true },
      { option: 'Vectors', active: false }
    ];
    this.viewPort = {
      width: 640,
      height: 480
    };

    this.setBackupTimestamp();
  }

  public getActivePoint(): Observable<number> {
    return this.activePoint$.asObservable();
  }

  public setActivePoint(point: number): void {
    this.activePoint$.next(point);
  }

  public getAmountProjectionLayers(): number {
    return this.amountProjectionLayers;
  }

  public setAmountProjectionLayers(amountProjectionLayers: number): void {
    this.amountProjectionLayers = amountProjectionLayers;
  }

  public getAmountTouchPoints(): Observable<number> {
    return this.amountTouchPoints$.asObservable();
  }

  public setAmoutTouchPoints(amountTouchPoints: number): void {
    this.amountTouchPoints$.next(amountTouchPoints);
  }

  public getBackgroundImage(): string {
    return this.backgroundImage;
  }

  public setBackgroundImage(backgroundImage: string): void {
    this.backgroundImage = backgroundImage;
    console.log('BackgroundImage:', this.backgroundImage);
    this.background$.next(this.backgroundImage);
    console.log('Background:', this.background$);
  }

  public getBackgroundSources(): Array<BackgroundSource> {
    return this.backgroundSources;
  }

  public setBackgroundSources(paths: Array<BackgroundSource>): void {
    this.backgroundSources = paths;
  }

  public getBackupTimestamp(): Observable<Date | null> {
    return this.backupTimestamp$.asObservable();
  }

  public setBackupTimestamp(): void {
    let timestamp: Date | null = null;
    const settings = localStorage.getItem('Gestenrecorder Settings');

    try {
      if (settings != null) {
        const parsed = JSON.parse(settings) as Pick<StoredSettings, 'BACKUP_TIMESTAMP'>;
        timestamp = new Date(parsed.BACKUP_TIMESTAMP);
      }
    } catch {
      timestamp = null;
    }

    this.backupTimestamp$.next(timestamp);
  }

  public getCamera(): Camera {
    return this.camera;
  }

  public setCamera(camera: Camera): void {
    this.camera = camera;
  }

  public getCameraOptions(): Array<Camera> {
    return CAMERAS;
  }

  public getCircleSize(): CircleSize {
    return this.circleSize;
  }

  public setCircleSize(circleSize: CircleSize): void {
    this.circleSize = circleSize;
  }

  public getLayers(): Observable<Layers> {
    return this.layers$.asObservable();
  }

  public setLayers(layers: Layers): void {
    this.layers$.next(layers);
  }

  public getNormalizedPoints(): Observable<Array<NormalizedPoint>> {
    return this.normalizedPoints$.asObservable();
  }

  public setNormalizedPoints(normalizedPoints: Array<NormalizedPoint>): void {
    this.normalizedPoints$.next(normalizedPoints);
  }

  public getSendInterval(): number {
    return this.sendInterval;
  }

  public setSendInterval(sendInterval: number): void {
    this.sendInterval = sendInterval;
  }

  public getServerConnection(): string {
    return this.serverConnection;
  }

  public setServerConnection(serverConnection: string): void {
    this.serverConnection = serverConnection;
  }

  public getViewOptions(): Array<ViewOption> {
    return this.viewOptions;
  }

  public setViewOptions(viewOptions: Array<ViewOption>): void {
    this.viewOptions = viewOptions;
  }

  public getViewPort(): ViewPort {
    return this.viewPort;
  }

  public setViewPort(viewPort: ViewPort): void {
    this.viewPort = viewPort;
  }

  public getLocalStorage(): void {
    const storageSettings = localStorage.getItem('Gestenrecorder Settings');
    if (storageSettings === null) {
      return;
    }
    const settings = JSON.parse(storageSettings) as StoredSettings;

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

  public setLocalStorage(): void {
    const amountTouchPoints = this.amountTouchPoints$.getValue();
    const layers = this.layers$.getValue();
    const normalizedPoints = this.normalizedPoints$.getValue();

    const settings = {
      BACKUP_TIMESTAMP: new Date().toLocaleString('de-DE'),
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
      viewPort: this.viewPort
    };

    localStorage.setItem(
      'Gestenrecorder Settings',
      JSON.stringify(settings)
    );
    this.setBackupTimestamp();
  }

  public clearLocalStorage(): void {
    localStorage.clear();
  }

  public ngOnDestroy(): void {
    this.amountTouchPoints$.unsubscribe();
    this.backupTimestamp$.unsubscribe();
    this.layers$.unsubscribe();
    this.normalizedPoints$.unsubscribe();
  }
}

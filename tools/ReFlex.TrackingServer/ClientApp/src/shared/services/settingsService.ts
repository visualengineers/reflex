import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Configuration, DataFormats, TrackingServerAppSettings } from '@reflex/shared-types';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class SettingsService {

  private readonly settingsSubject: Subject<TrackingServerAppSettings>;
  private readonly settings$: Observable<TrackingServerAppSettings>;

  private readonly settingsRoute = `${this.baseUrl}api/Settings`;
  private readonly setBorderRoute = `${this.settingsRoute}/Border`;
  private readonly setMinDistanceFromSensorRoute = `${this.settingsRoute}/MinDistanceFromSensor`;
  private readonly setThresholdRoute = `${this.settingsRoute}/Threshold`;
  private readonly setMinAngleRoute = `${this.settingsRoute}/minAngle`;
  private readonly setConfidenceRoute = `${this.settingsRoute}/Confidence`;
  private readonly setSmoothingValuesRoute = `${this.settingsRoute}/Smoothing`;
  private readonly setExtremumSettingsRoute = `${this.settingsRoute}/ExtremumsCheck`;
  private readonly setDistanceRoute = `${this.settingsRoute}/Distance`;
  private readonly setOptimizedBoxFilterRoute = `${this.settingsRoute}/UseOptimizedBoxFilter`;
  private readonly setFilterRadiusRoute = `${this.settingsRoute}/FilterRadius`;
  private readonly setFilterPassesRoute = `${this.settingsRoute}/FilterPasses`;
  private readonly setFilterThreadsRoute = `${this.settingsRoute}/FilterThreads`;
  private readonly setLimitationFilterTypeRoute = `${this.settingsRoute}/LimitationFilterType`;
  private readonly saveSettingsRoute = `${this.settingsRoute}`;
  private readonly canRestoreRoute = `${this.settingsRoute}/CanRestore`;
  private readonly getZeroPlaneDistanceRoute = `${this.settingsRoute}/ComputeZeroPlaneDistance`;
  private readonly initializeAdvancedLimitationFilterRoute = `${this.settingsRoute}/InitializeAdvancedLimitationFilter`;
  private readonly resetAdvancedLimitationFilterRoute = `${this.settingsRoute}/ResetAdvancedLimitationFilter`;
  private readonly limitationFilterInitializingRoute = `${this.settingsRoute}/LimitationFilterInitializing`;
  private readonly limitationFilterInitStateRoute = `${this.settingsRoute}/LimitationFilterInitState`;
  private readonly restoreRoute = `${this.settingsRoute}/Restore`;
  private readonly resetRoute = `${this.settingsRoute}/Reset`;


  public constructor(
    private readonly http: HttpClient,
    // eslint-disable-next-line new-cap
    @Inject('BASE_URL') private readonly baseUrl: string
  ) {
    this.settingsSubject = new Subject<TrackingServerAppSettings>();
    this.settings$ = this.settingsSubject.asObservable();
    this.update();
  }

  public getSettings(): Observable<TrackingServerAppSettings> {
    return this.settings$;
  }

  public update(): void {
    this.http.get<TrackingServerAppSettings>(this.settingsRoute).subscribe((result) => this.settingsSubject.next(result));
  }

  public setBorder(border: Configuration.Border): Observable<Configuration.Border> {
    return this.http.post<Configuration.Border>(this.setBorderRoute, border);
  }

  public setMinDistanceFromSensor(distance: number): Observable<number> {
    return this.http.post<number>(this.setMinDistanceFromSensorRoute, distance);
  }

  public setThreshold(threshold: number): Observable<DataFormats.JsonSimpleValue> {
    return this.http.post<DataFormats.JsonSimpleValue>(this.setThresholdRoute, threshold);
  }

  public setConfidence(confidence: Configuration.ConfidenceParameter): Observable<Configuration.ConfidenceParameter> {
    return this.http.post<Configuration.ConfidenceParameter>(this.setConfidenceRoute, confidence);
  }

  public setSmoothingValues(smoothing: Configuration.SmoothingParameter): Observable<Configuration.SmoothingParameter> {
    return this.http.post<Configuration.SmoothingParameter>(this.setSmoothingValuesRoute, smoothing);
  }

  public setExtremumSettings(extremumSettings: Configuration.ExtremumDescriptionSettings): Observable<Configuration.ExtremumDescriptionSettings> {
    return this.http.post<Configuration.ExtremumDescriptionSettings>(this.setExtremumSettingsRoute, extremumSettings);
  }

  public setDistance(distance: Configuration.Distance): Observable<Configuration.Distance> {
    return this.http.post<Configuration.Distance>(this.setDistanceRoute, distance);
  }

  public setOptimizedBoxFilter(useOptimizedBoxFilter: boolean): Observable<DataFormats.JsonSimpleValue> {
    const sValue: DataFormats.JsonSimpleValue = {
      name: 'UseOptimizedBoxFilter',
      value: useOptimizedBoxFilter
    };

    return this.http.post<DataFormats.JsonSimpleValue>(`${this.setOptimizedBoxFilterRoute}`, sValue);
  }

  public setFilterRadius(filterRadius: number): Observable<DataFormats.JsonSimpleValue> {
    return this.http.put<DataFormats.JsonSimpleValue>(`${this.setFilterRadiusRoute}/${filterRadius}`, '');
  }

  public setFilterPasses(filterPasses: number): Observable<DataFormats.JsonSimpleValue> {
    return this.http.put<DataFormats.JsonSimpleValue>(`${this.setFilterPassesRoute}/${filterPasses}`, '');
  }

  public setFilterThreads(filterThreads: number): Observable<DataFormats.JsonSimpleValue> {
    return this.http.put<DataFormats.JsonSimpleValue>(`${this.setFilterThreadsRoute}/${filterThreads}`, '');
  }

  public setMinAngle(minAngle: number): Observable<DataFormats.JsonSimpleValue> {
    return this.http.post<DataFormats.JsonSimpleValue>(this.setMinAngleRoute, minAngle);
  }

  public setLimitationFilterType(filterSettings: Configuration.FilterSettings): Observable<DataFormats.JsonSimpleValue> {
    return this.http.post<DataFormats.JsonSimpleValue>(this.setLimitationFilterTypeRoute, filterSettings);
  }

  public getCanRestore(): Observable<DataFormats.JsonSimpleValue> {
    return this.http.get<DataFormats.JsonSimpleValue>(this.canRestoreRoute);
  }

  public getZeroPlaneDistance(): Observable<Configuration.Distance> {
    return this.http.get<Configuration.Distance>(this.getZeroPlaneDistanceRoute);
  }

  public initializeAdvancedLimitationFilter(): Observable<DataFormats.JsonSimpleValue> {
    return this.http.get<DataFormats.JsonSimpleValue>(this.initializeAdvancedLimitationFilterRoute);
  }

  public resetAdvancedLimitationFilter(): Observable<DataFormats.JsonSimpleValue> {
    return this.http.get<DataFormats.JsonSimpleValue>(this.resetAdvancedLimitationFilterRoute);
  }

  public isLimitationFilterInitialized(): Observable<DataFormats.JsonSimpleValue> {
    return this.http.get<DataFormats.JsonSimpleValue>(this.limitationFilterInitStateRoute);
  }

  public isLimitationFilterInitializing(): Observable<DataFormats.JsonSimpleValue> {
    return this.http.get<DataFormats.JsonSimpleValue>(this.limitationFilterInitializingRoute);
  }

  public restore(): Observable<TrackingServerAppSettings> {
    return this.http.get<TrackingServerAppSettings>(this.restoreRoute);
  }

  public reset(): Observable<TrackingServerAppSettings> {
    return this.http.get<TrackingServerAppSettings>(this.resetRoute);
  }

  public saveSettings(settings: TrackingServerAppSettings): Observable<object> {
    return this.http.post<object>(this.saveSettingsRoute, settings);
  }

}

import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Border } from '../config/border';
import { ConfidenceParameter } from '../config/confidenceParameter';
import { Distance } from '../config/distance';
import { ExtremumDescriptionSettings } from '../config/extremumDescriptionSettings';
import { FilterSettings } from '../config/filterSettings';
import { SmoothingParameter } from '../config/smoothing-parameter';
import { JsonSimpleValue } from '../data-formats/json-simple-value';
import { TrackingServerAppSettings } from '../trackingServerAppSettings';

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

  public setBorder(border: Border): Observable<Border> {
    return this.http.post<Border>(this.setBorderRoute, border);
  }

  public setMinDistanceFromSensor(distance: number): Observable<number> {
    return this.http.post<number>(this.setMinDistanceFromSensorRoute, distance);
  }

  public setThreshold(threshold: number): Observable<JsonSimpleValue> {
    return this.http.post<JsonSimpleValue>(this.setThresholdRoute, threshold);
  }

  public setConfidence(confidence: ConfidenceParameter): Observable<ConfidenceParameter> {
    return this.http.post<ConfidenceParameter>(this.setConfidenceRoute, confidence);
  }

  public setSmoothingValues(smoothing: SmoothingParameter): Observable<SmoothingParameter> {
    return this.http.post<SmoothingParameter>(this.setSmoothingValuesRoute, smoothing);
  }

  public setExtremumSettings(extremumSettings: ExtremumDescriptionSettings): Observable<ExtremumDescriptionSettings> {
    return this.http.post<ExtremumDescriptionSettings>(this.setExtremumSettingsRoute, extremumSettings);
  }

  public setDistance(distance: Distance): Observable<Distance> {
    return this.http.post<Distance>(this.setDistanceRoute, distance);
  }

  public setOptimizedBoxFilter(useOptimizedBoxFilter: boolean): Observable<JsonSimpleValue> {
    const sValue: JsonSimpleValue = {
      name: 'UseOptimizedBoxFilter',
      value: useOptimizedBoxFilter
    };

    return this.http.post<JsonSimpleValue>(`${this.setOptimizedBoxFilterRoute}`, sValue);
  }

  public setFilterRadius(filterRadius: number): Observable<JsonSimpleValue> {
    return this.http.put<JsonSimpleValue>(`${this.setFilterRadiusRoute}/${filterRadius}`, '');
  }

  public setFilterPasses(filterPasses: number): Observable<JsonSimpleValue> {
    return this.http.put<JsonSimpleValue>(`${this.setFilterPassesRoute}/${filterPasses}`, '');
  }

  public setFilterThreads(filterThreads: number): Observable<JsonSimpleValue> {
    return this.http.put<JsonSimpleValue>(`${this.setFilterThreadsRoute}/${filterThreads}`, '');
  }

  public setMinAngle(minAngle: number): Observable<JsonSimpleValue> {
    return this.http.post<JsonSimpleValue>(this.setMinAngleRoute, minAngle);
  }

  public setLimitationFilterType(filterSettings: FilterSettings): Observable<JsonSimpleValue> {
    return this.http.post<JsonSimpleValue>(this.setLimitationFilterTypeRoute, filterSettings);
  }

  public getCanRestore(): Observable<JsonSimpleValue> {
    return this.http.get<JsonSimpleValue>(this.canRestoreRoute);
  }

  public getZeroPlaneDistance(): Observable<Distance> {
    return this.http.get<Distance>(this.getZeroPlaneDistanceRoute);
  }

  public initializeAdvancedLimitationFilter(): Observable<JsonSimpleValue> {
    return this.http.get<JsonSimpleValue>(this.initializeAdvancedLimitationFilterRoute);
  }

  public resetAdvancedLimitationFilter(): Observable<JsonSimpleValue> {
    return this.http.get<JsonSimpleValue>(this.resetAdvancedLimitationFilterRoute);
  }

  public isLimitationFilterInitialized(): Observable<JsonSimpleValue> {
    return this.http.get<JsonSimpleValue>(this.limitationFilterInitStateRoute);
  }

  public isLimitationFilterInitializing(): Observable<JsonSimpleValue> {
    return this.http.get<JsonSimpleValue>(this.limitationFilterInitializingRoute);
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

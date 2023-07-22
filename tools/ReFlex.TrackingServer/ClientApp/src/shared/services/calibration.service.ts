import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { fromEventPattern, Observable, using } from 'rxjs';
import { SignalRBaseService } from './signalR.base.service';
import { concatMap, map } from 'rxjs/operators';
import { LogService } from 'src/app/log/log.service';

@Injectable({
  providedIn: 'root'
})
export class CalibrationService extends SignalRBaseService<string> {

  private readonly calibrationRoute = 'api/Calibration/';
  private readonly getFrameSizeRoute = `${this.calibrationRoute}FrameSize`;
  private readonly getSourceValuesRoute = `${this.calibrationRoute}SourceValues`;
  private readonly getTargetValuesRoute = `${this.calibrationRoute}TargetValues`;
  private readonly getCalibrationMatrixRoute = `${this.calibrationRoute}GetCalibrationMatrix`;
  private readonly applyCalibrationRoute = `${this.calibrationRoute}ApplyCalibration`;
  private readonly restartCalibrationRoute = `${this.calibrationRoute}Restart`;
  private readonly saveCalibrationRoute = `${this.calibrationRoute}SaveCalibration`;
  private readonly calibrateInteractionsRoute = `${this.calibrationRoute}CalibratedInteractions`;

  private readonly updateFrameSizeRoute = `${this.calibrationRoute}UpdateFrameSize`;
  private readonly updateCalibrationPointRoute = `${this.calibrationRoute}UpdateCalibrationPoint/`;

  // eslint-disable-next-line new-cap
  public constructor(private readonly http: HttpClient, @Inject('BASE_URL') private readonly baseUrl: string, logService: LogService) {
    super(`${baseUrl}calibhub`, 'calibrationState', logService);
  }

  public getFrameSize(): Observable<FrameSizeDefinition> {
    return this.http.get<FrameSizeDefinition>(this.baseUrl + this.getFrameSizeRoute);
  }

  public getCalibrationSourcePoints(): Observable<Array<CalibrationPoint>> {
    return this.http.get<Array<CalibrationPoint>>(this.baseUrl + this.getSourceValuesRoute);
  }

  public getCurrentCalibrationTargetPoints(): Observable<Array<CalibrationPoint>> {
    return this.http.get<Array<CalibrationPoint>>(this.baseUrl + this.getTargetValuesRoute);
  }

  public getCalibrationMatrix(): Observable<CalibrationTransform> {
    return this.http.get<CalibrationTransform>(this.baseUrl + this.getCalibrationMatrixRoute);
  }

  public applyCalibration(): Observable<CalibrationTransform> {
    return this.http.get<CalibrationTransform>(this.baseUrl + this.applyCalibrationRoute);
  }

  public restartCalibration(): Observable<CalibrationTransform> {
    return this.http.get<CalibrationTransform>(this.baseUrl + this.restartCalibrationRoute);
  }

  public saveCalibration(): Observable<CalibrationTransform> {
    return this.http.get<CalibrationTransform>(this.baseUrl + this.saveCalibrationRoute);
  }

  public updateFrameSize(newSize: FrameSizeDefinition): Observable<HttpResponse<FrameSizeDefinition>> {
    return this.http.post<FrameSizeDefinition>(this.baseUrl + this.updateFrameSizeRoute, newSize, { observe: 'response' });
  }

  public updateCalibrationPoint(idx: number, target: CalibrationPoint): Observable<HttpResponse<CalibrationTransform>> {
    return this.http.post<CalibrationTransform>(`${this.baseUrl}${this.updateCalibrationPointRoute}${idx}`, target, { observe: 'response' });
  }

  public computeCalibratedPosition(rawInteractions: Array<Interaction>): Observable<HttpResponse<Array<Interaction>>> {
    return this.http.post<Array<Interaction>>(`${this.baseUrl}${this.calibrateInteractionsRoute}`, rawInteractions, { observe: 'response' });
  }

  public computeCalibratedAbsolutePosition(rawInteractions: Array<Interaction>): Observable<CompleteInteractionData> {
    return this.computeCalibratedPosition(rawInteractions).pipe(
      concatMap((result) => {
        let normalized: Array<Interaction> = [];
        if (result.body && result.ok) {
          normalized = result.body;
        }

        return this.getFrameSize().pipe(map((frame) => ({
          raw: rawInteractions,
          normalized: normalized,
          absolute: this.transform(frame, normalized)
        })));
      })
    );
  }

  public getCalibration(): Observable<Calibration> {
    const calibration$ = fromEventPattern<Calibration>(
      (handler) => this.connection.on('Calibration', handler),
      (handler) => this.connection.off('Calibration', handler)
    );

    return using(() => {
      this.connection.send('StartCalibrationSubscription').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      return { unsubscribe: async () => this.connection.send('StopCalibrationSubscription').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }) };
    }, () => calibration$);

  }

  private transform(borders: FrameSizeDefinition, normalized: Array<Interaction>): Array<Interaction> {

    const calibrated: Array<Interaction> = [];

    normalized.forEach((norm) => {
      const x = (norm.position.x * borders.width) + borders.left;
      const y = (norm.position.y * borders.height) + borders.top;

      const absolutePos: Point3 = { x: x, y: y, z: norm.position.z, isValid: norm.position.isValid, isFiltered: norm.position.isFiltered };
      calibrated.push({
        touchId: norm.touchId,
        position: absolutePos,
        confidence: norm.confidence,
        time: norm.time,
        type: norm.type,
        extremumDescription: norm.extremumDescription
      });
    });

    return calibrated;
  }
}

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HubConnection } from '@microsoft/signalr';
import { LogService } from 'src/app/log/log.service';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { CalibrationService } from './calibration.service';

describe('Calibration integer pixel HTTP contract', () => {
  let service: CalibrationService;
  let http: HttpTestingController;

  beforeEach(() => {
    vi.spyOn(HubConnection.prototype, 'start').mockResolvedValue();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: BASE_URL, useValue: 'http://localhost/' },
      { provide: LogService, useValue: { sendErrorLog: vi.fn() } }
    ] });
    service = TestBed.inject(CalibrationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it.each([
    { positionX: 100 + (1 / 3), positionY: 150 + (2 / 3), touchId: 42 },
    { positionX: 100, positionY: 151, touchId: 42 }
  ])('posts integer target pixels without changing the input ($positionX, $positionY)', (value) => {
    const target = Object.freeze(value);
    service.updateCalibrationPoint(1, target).subscribe();
    const request = http.expectOne('http://localhost/api/Calibration/UpdateCalibrationPoint/1');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ positionX: 100, positionY: 151, touchId: 42 });
    expect(request.request.body).not.toBe(target);
    request.flush({ transformation: [[1, 0], [0, 1]] });
  });

  it.each([
    { left: 112.5, top: 37.5, width: 1000.4, height: 600.6 },
    { left: 113, top: 38, width: 1000, height: 601 }
  ])('posts integer viewport pixels without changing the input ($left, $top)', (value) => {
    const frame = Object.freeze(value);
    service.updateFrameSize(frame).subscribe();
    const request = http.expectOne('http://localhost/api/Calibration/UpdateFrameSize');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ left: 113, top: 38, width: 1000, height: 601 });
    expect(request.request.body).not.toBe(frame);
    request.flush({ left: 113, top: 38, width: 1000, height: 601 });
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DEFAULT_SETTINGS } from '@reflex/shared-types';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { SettingsService } from './settingsService';

describe('Assignment settings HTTP contract', () => {
  let service: SettingsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: BASE_URL, useValue: 'http://localhost/' }
    ] });
    service = TestBed.inject(SettingsService);
    http = TestBed.inject(HttpTestingController);
    http.expectOne('http://localhost/api/Settings').flush(structuredClone(DEFAULT_SETTINGS));
  });

  afterEach(() => http.verify());

  it.each([true, false])('posts the Kalman switch as a JSON boolean: %s', (enabled) => {
    service.setUseKalmanFilter(enabled).subscribe();
    const request = http.expectOne('http://localhost/api/Settings/UseKalmanFilter');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBe(enabled);
    request.flush(enabled);
  });

  it.each([true, false])('posts the JPDA switch as a JSON boolean: %s', (enabled) => {
    service.setUseJpda(enabled).subscribe();
    const request = http.expectOne('http://localhost/api/Settings/UseJpda');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBe(enabled);
    request.flush(enabled);
  });

  it('posts false as a JSON boolean', () => {
    let actual: boolean | undefined;
    service.setUseMinimumCostAssignment(false).subscribe((value) => {
      actual = value;
    });
    const request = http.expectOne('http://localhost/api/Settings/UseMinimumCostAssignment');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBe(false);
    request.flush(false);
    expect(actual).toBe(false);
  });

  it('posts fractional and zero costs as JSON numbers', () => {
    service.setAssignmentMissCost(0).subscribe();
    const miss = http.expectOne('http://localhost/api/Settings/AssignmentMissCost');
    expect(miss.request.method).toBe('POST');
    expect(miss.request.body).toBe(0);
    miss.flush(0);
    service.setAssignmentBirthCost(1.25).subscribe();
    const birth = http.expectOne('http://localhost/api/Settings/AssignmentBirthCost');
    expect(birth.request.method).toBe('POST');
    expect(birth.request.body).toBe(1.25);
    birth.flush(1.25);
  });
});

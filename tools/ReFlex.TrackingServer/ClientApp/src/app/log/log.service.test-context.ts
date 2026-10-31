export let httpTestingController: HttpTestingController;
export let httpClient: HttpClient;
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { LogService } from './log.service';

export let service: LogService;

export function setupTests(): void {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [],
      providers: [
        {
          provide: BASE_URL,
          useValue: 'http://localhost/'
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(LogService);
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  beforeEach(() => {});

  afterEach(() => {
    httpTestingController.verify();
  });
}

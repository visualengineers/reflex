import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TrackingService } from 'src/shared/services/tracking.service';
import { WebSocketService } from 'src/shared/services/webSocket.service';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { DepthImageComponent } from './depth-image.component';
import { trackingService, wsMock } from './depth-image.component.test-data';

export let component: DepthImageComponent;

export let fixture: ComponentFixture<DepthImageComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, DepthImageComponent],
      providers: [
        {
          provide: TrackingService,
          useValue: trackingService
        },
        {
          provide: WebSocketService,
          useValue: wsMock
        },
        {
          provide: BASE_URL,
          useValue: 'http://localhost'
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    trackingService.getStatus.mockClear();
  });
}

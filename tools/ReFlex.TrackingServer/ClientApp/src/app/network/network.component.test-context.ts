import {
  HttpResponse,
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MockPanelHeaderComponent,
  MockValueSelectionComponent,
  MockValueSliderComponent,
  MockValueTextComponent,
  PanelHeaderComponent,
  ValueSelectionComponent,
  ValueSliderComponent,
  ValueTextComponent
} from '@reflex/angular-components/dist';
import {
  DEFAULT_SETTINGS,
  JsonSimpleValue
} from '@reflex/shared-types';
import { of } from 'rxjs';
import { NetworkingService } from 'src/shared/services/networking.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { LogService } from '../log/log.service';
import { NetworkComponent } from './network.component';
import { logService, networkService, networkSettings, settingsService } from './network.component.test-data';
import { TuioComponent } from './tuio/tuio.component';
import { MockTuioComponent } from './tuio/tuio.component.mock';

export let component: NetworkComponent;

export let fixture: ComponentFixture<NetworkComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, NetworkComponent],
      providers: [
        {
          provide: NetworkingService,
          useValue: networkService
        },
        {
          provide: SettingsService,
          useValue: settingsService
        },
        {
          provide: LogService,
          useValue: logService
        },
        {
          provide: BASE_URL,
          useValue: 'http://localhost'
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .overrideComponent(NetworkComponent, {
        remove: {
          imports: [
            PanelHeaderComponent,
            ValueSelectionComponent,
            ValueTextComponent,
            ValueSliderComponent,
            TuioComponent
          ]
        },
        add: {
          imports: [
            MockPanelHeaderComponent,
            MockValueSelectionComponent,
            MockValueTextComponent,
            MockValueSliderComponent,
            MockTuioComponent
          ]
        }
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkComponent);
    component = fixture.componentInstance;

    settingsService.getSettings.mockReturnValue(of(DEFAULT_SETTINGS));
    settingsService.saveSettings.mockReturnValue(of(DEFAULT_SETTINGS));

    logService.sendErrorLog.mockReturnValue(undefined);

    networkService.getStatusValues.mockReturnValue(of(networkSettings));
    networkService.getStatus.mockReturnValue(of('Connected to Testservice...'));

    networkService.saveSettings.mockReturnValue(
      of(
        new HttpResponse<JsonSimpleValue>({
          body: {
            name: 'save result',
            value: 'save succesful !'
          }
        })
      )
    );
  });

  afterEach(() => {
    settingsService.getSettings.mockClear();
    settingsService.saveSettings.mockClear();

    logService.sendErrorLog.mockClear();

    networkService.getStatusValues.mockClear();
    networkService.getStatus.mockClear();
  });
}

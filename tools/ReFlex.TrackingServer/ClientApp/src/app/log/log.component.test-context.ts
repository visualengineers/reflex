import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MockValueSelectionComponent,
  ValueSelectionComponent
} from '@reflex/angular-components/dist';
import { of } from 'rxjs';
import { LogComponent } from './log.component';
import { logService } from './log.component.test-data';
import { LogService } from './log.service';

export let component: LogComponent;

export let fixture: ComponentFixture<LogComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, LogComponent],
      providers: [
        {
          provide: LogService,
          useValue: logService
        }
      ]
    })
      .overrideComponent(LogComponent, {
        remove: { imports: [ValueSelectionComponent] },
        add: { imports: [MockValueSelectionComponent] }
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogComponent);
    component = fixture.componentInstance;
    logService.getLogs.mockReturnValue(of());
  });

  afterEach(() => {
    logService.getLogs.mockClear();
    logService.reset.mockClear();
    logService.sendErrorLog.mockClear();

    component.filterLevel = -1;
    component.messages = [];
  });
}

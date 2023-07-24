import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { LogComponent } from './log.component';
import { LogService } from './log.service';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MockValueSelectionComponent } from '../elements/value-selection/value-selection.component.mock';
import { LogLevel, LogMessageDetail } from '@reflex/shared-types';

const logService = jasmine.createSpyObj<LogService>('fakeLogService', 
  [
    'getLogs',
    'sendErrorLog',
    'reset'
  ]);

const messages: Array<LogMessageDetail> = [
  { id: 0, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
  { id: 1, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
  { id: 2, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
  { id: 3, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
  { id: 4, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
  { id: 5, level: LogLevel.Trace, formattedMessage: 'Lorem ipsum' },
  { id: 6, level: LogLevel.Error, formattedMessage: 'Lorem ipsum' },
  { id: 7, level: LogLevel.Error, formattedMessage: 'Lorem ipsum' },
  { id: 8, level: LogLevel.Trace, formattedMessage: 'Lorem ipsum' },
  { id: 9, level: LogLevel.Error, formattedMessage: 'Lorem ipsum' },
  { id: 10, level: LogLevel.Trace, formattedMessage: 'Lorem ipsum' },
  { id: 11, level: LogLevel.Fatal, formattedMessage: 'Lorem ipsum' },
  { id: 12, level: LogLevel.Trace, formattedMessage: 'Lorem ipsum' },
  { id: 13, level: LogLevel.Error, formattedMessage: 'Lorem ipsum' },
  { id: 14, level: LogLevel.Trace, formattedMessage: 'Lorem ipsum' }
];

logService.reset.and.returnValue();
logService.sendErrorLog.and.returnValue();

describe('LogComponent', () => {
  let component: LogComponent;
  let fixture: ComponentFixture<LogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LogComponent, MockValueSelectionComponent ],
      imports: [ FormsModule ],
      providers: [
        {
          provide: LogService, useValue: logService
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogComponent);
    component = fixture.componentInstance; 
    logService.getLogs.and.rejectWith();  
  });

  afterEach(() => {
    logService.getLogs.calls.reset();    
    logService.reset.calls.reset();
    logService.sendErrorLog.calls.reset();

    component.filterLevel = -1;
    component.messages = [];
  })

  it('should create', () => {
    logService.getLogs.and.returnValue(of(messages[0]));

    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.reset).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should receive messages', () => {
    logService.getLogs.and.returnValue(of(messages[0]));

    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.getLogs).toHaveBeenCalledTimes(1);
    expect(component.messages).toHaveSize(1);
    expect(component.filteredMessages).toHaveSize(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should automatically filter incoming messages', () => {
    logService.getLogs.and.returnValue(of(messages[5]));
    component.filterLevel = 2;

    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.getLogs).toHaveBeenCalledTimes(1);
    expect(component.messages).toHaveSize(1);
    expect(component.filteredMessages).toHaveSize(0);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should filter correctly', () => {
    component.messages = messages;

    fixture.detectChanges();

    component.filter();

    expect(component.filteredMessages).toHaveSize(messages.length);
    expect(component.filteredMessages).toEqual(messages);

    // only TRACE messages
    component.filterLevel = 0; 

    component.filter();

    expect(component.filteredMessages).toHaveSize(5);
    expect(component.filteredMessages).toEqual([messages[5],messages[8],messages[10],messages[12],messages[14]]);

    // only DEBUG messages
    component.filterLevel = 1;
    component.filter();

    expect(component.filteredMessages).toHaveSize(2);
    expect(component.filteredMessages).toEqual([messages[0],messages[1]]);
    
    // only INFO messages
    component.filterLevel = 2;
    component.filter();

    expect(component.filteredMessages).toHaveSize(0);
    expect(component.filteredMessages).toEqual([]);    

    // only WARN messages
    component.filterLevel = 3; 
    component.filter();

    expect(component.filteredMessages).toHaveSize(3);
    expect(component.filteredMessages).toEqual([messages[2],messages[3],messages[4]]);

    // only ERROR messages
    component.filterLevel = 4;
    component.filter();

    expect(component.filteredMessages).toHaveSize(4);
    expect(component.filteredMessages).toEqual([messages[6],messages[7],messages[9],messages[13]]);

    // only FATAL messages
    component.filterLevel = 5;
    component.filter();

    expect(component.filteredMessages).toHaveSize(1);
    expect(component.filteredMessages).toEqual([messages[11]]);

    // OFF
    component.filterLevel = 6;
    component.filter();

    expect(component.filteredMessages).toHaveSize(0);
    expect(component.filteredMessages).toEqual([]);

    // reset filter
    component.filterLevel = -1;
    component.filter();

    expect(component.filteredMessages).toHaveSize(15);
    expect(component.filteredMessages).toEqual(messages);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it ('reset messages correctly', () => {
    component.messages = messages;

    fixture.detectChanges();
    component.filter();

    expect(component.messages).toHaveSize(15);
    expect(component.filteredMessages).toHaveSize(15);

    component.refresh();

    expect(component.messages).toHaveSize(0);
    expect(component.filteredMessages).toHaveSize(0);

    expect(logService.reset).toHaveBeenCalledTimes(2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should correctly return class for log level', () => {
    fixture.detectChanges();

    expect(component.getClass(LogLevel.Trace)).toEqual('table-dark');
    expect(component.getClass(LogLevel.Info)).toEqual('table-dark');
    expect(component.getClass(LogLevel.Debug)).toEqual('table-info');
    expect(component.getClass(LogLevel.Warn)).toEqual('table-warning');
    expect(component.getClass(LogLevel.Error)).toEqual('table-danger');
    expect(component.getClass(LogLevel.Fatal)).toEqual('table-danger');
    expect(component.getClass(LogLevel.Off)).toEqual('table-light');
  });

  it('should handle errors correctly', () => {

    const errorLogs = 'TestError: logService.getLogs';
    logService.getLogs.and.returnValue(throwError(errorLogs));

    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.getLogs).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledOnceWith(errorLogs);

    expect(component.messages).toBeDefined();
    expect(component.filteredMessages).toBeDefined();
  });
});

import { HttpClient, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { LogService } from "./log.service";
import { LogLevel, LogMessageDetail } from "@reflex/shared-types";

let httpClient: HttpClient;
let httpTestingController: HttpTestingController;

describe('LogService', () => {  
    let service: LogService;
    
    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
    declarations: [],
    imports: [],
    providers: [
        {
            provide: 'BASE_URL', useValue: 'http://localhost/'
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});

      service = TestBed.inject(LogService);
      httpClient = TestBed.inject(HttpClient);
      httpTestingController = TestBed.inject(HttpTestingController);
    }));
  
    beforeEach(() => {
        
    });

    afterEach(() => {  
        httpTestingController.verify();      
    });

    it('should create', () => {     
      expect(service).toBeTruthy();
      expect(httpTestingController).toBeTruthy();
      expect(httpClient).toBeTruthy();
    });

    it('should send errors to correct address', () => {
      const errorMsg = 'This is a test message for LogService.sendErrorLog.';
      service.sendErrorLog(errorMsg);

      const matchUrl = 'http://localhost/api/Log/Add/';

      const req = httpTestingController.expectOne({ url: matchUrl, method: 'POST'});
      
      expect(req.request.headers.get('Content-Type')).toEqual('application/json');
      expect(req.request.body).toEqual({ name: 'message', value: errorMsg });

      req.flush('');
    });

    it('should correctly retrieve messages', (done) => {
      const logMessages = [        
        { id: 0, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 1, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 2, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
        { id: 3, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' }
      ];

      var i = 0;

      service.getLogs().subscribe(
        (list: LogMessageDetail) => {
          expect(list).toEqual(logMessages[i]);
          i++;          
        },
        (error) => {
            console.error(error);
            fail();
        },
        () => {
            expect(i).toBe(4);
            expect(service['index']).toBe(3);
            done();
        }
      );
  
      const matchUrl = 'http://localhost/api/Log/Messages/0';
    
      const req = httpTestingController.expectOne({ url: matchUrl, method: 'GET'});

      req.flush(logMessages);
    });

    it ('should correctly apply and reset index', (done) => {
      const logMessages = [        
        { id: 0, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 1, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 2, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
        { id: 3, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 4, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 5, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 6, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
        { id: 7, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 8, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 9, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 10, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
        { id: 11, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 12, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 13, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 14, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
        { id: 15, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 16, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 17, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
        { id: 18, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
        { id: 19, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      ];

      var i = 10;
      service['index'] = i;      

      service.getLogs().subscribe(
        (list: LogMessageDetail) => {
          expect(list).toEqual(logMessages[i]);
          i++;          
        },
        (error) => {
            console.error(error);
            fail();
        },
        () => {
            expect(i).toBe(20);
            expect(service['index']).toBe(19);

            service.reset();
            expect(service['index']).toBe(0);

            done();
        }
      );
  
      const matchUrl = 'http://localhost/api/Log/Messages/10';
    
      const req = httpTestingController.expectOne({ url: matchUrl, method: 'GET'});

      req.flush(logMessages.filter((msg) => msg.id >= 10));
    });

});
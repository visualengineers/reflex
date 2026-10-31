import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ConnectionService } from './service/connection.service';


export function setupTests(): void {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ConnectionService,
          useValue: {
            init: vi.fn(),
            destroy: vi.fn(),
            disconnect: vi.fn(),
            sendMessage: vi.fn(),
            connectionSuccessful: new Subject<boolean>()
          }
        }
      ]
    });
  });
}

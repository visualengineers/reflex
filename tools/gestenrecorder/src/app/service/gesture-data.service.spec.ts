import { TestBed } from '@angular/core/testing';

import { GestureDataService } from './gesture-data.service';

describe('GestureDataService', () => {
  let service: GestureDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestureDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

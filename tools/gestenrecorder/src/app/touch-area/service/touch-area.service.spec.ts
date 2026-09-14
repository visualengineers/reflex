import { TestBed } from '@angular/core/testing';

import { TouchAreaService } from './touch-area.service';

describe('TouchAreaService', () => {
  let service: TouchAreaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TouchAreaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

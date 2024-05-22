import { TestBed } from '@angular/core/testing';

import { CircleRendererService } from './circle-renderer.service';

describe('CircleRendererService', () => {
  let service: CircleRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CircleRendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

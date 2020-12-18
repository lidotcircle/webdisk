import { TestBed } from '@angular/core/testing';

import { MousePointerService } from './mouse-pointer.service';

describe('MousePointerService', () => {
  let service: MousePointerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MousePointerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

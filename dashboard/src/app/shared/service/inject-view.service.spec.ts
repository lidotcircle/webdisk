import { TestBed } from '@angular/core/testing';

import { InjectViewService } from './inject-view.service';

describe('InjectViewService', () => {
  let service: InjectViewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InjectViewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

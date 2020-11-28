import { TestBed } from '@angular/core/testing';

import { InjectFullScreenViewService } from './inject-full-screen-view.service';

describe('InjectFullScreenViewService', () => {
  let service: InjectFullScreenViewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InjectFullScreenViewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

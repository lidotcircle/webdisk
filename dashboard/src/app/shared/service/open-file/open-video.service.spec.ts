import { TestBed } from '@angular/core/testing';

import { OpenVideoService } from './open-video.service';

describe('OpenVideoService', () => {
  let service: OpenVideoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenVideoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

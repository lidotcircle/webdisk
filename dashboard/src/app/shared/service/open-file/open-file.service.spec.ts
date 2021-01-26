import { TestBed } from '@angular/core/testing';

import { OpenFileService } from './open-file.service';

describe('OpenFileService', () => {
  let service: OpenFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

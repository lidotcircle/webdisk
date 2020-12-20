import { TestBed } from '@angular/core/testing';

import { UploadSessionService } from './upload-session.service';

describe('UploadSessionService', () => {
  let service: UploadSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UploadSessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

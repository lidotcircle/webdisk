import { TestBed } from '@angular/core/testing';

import { UpdadeFileService } from './updade-file.service';

describe('UpdadeFileService', () => {
  let service: UpdadeFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpdadeFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

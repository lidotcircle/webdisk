import { TestBed } from '@angular/core/testing';

import { FileViewerService } from './file-viewer.service';

describe('FileViewerService', () => {
  let service: FileViewerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileViewerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

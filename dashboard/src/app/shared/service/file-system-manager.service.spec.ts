import { TestBed } from '@angular/core/testing';

import { FileSystemManagerService } from './file-system-manager.service';

describe('FileSystemManagerService', () => {
  let service: FileSystemManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileSystemManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

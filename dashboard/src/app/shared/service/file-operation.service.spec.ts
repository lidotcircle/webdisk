import { TestBed } from '@angular/core/testing';

import { FileOperationService } from './file-operation.service';

describe('FileOperationService', () => {
  let service: FileOperationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileOperationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

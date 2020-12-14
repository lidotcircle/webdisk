import { TestBed } from '@angular/core/testing';

import { CurrentDirectoryService } from './current-directory.service';

describe('CurrentDirectoryService', () => {
  let service: CurrentDirectoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurrentDirectoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

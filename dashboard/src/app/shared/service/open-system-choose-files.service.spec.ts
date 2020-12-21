import { TestBed } from '@angular/core/testing';

import { OpenSystemChooseFilesService } from './open-system-choose-files.service';

describe('OpenSystemChooseFilesService', () => {
  let service: OpenSystemChooseFilesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenSystemChooseFilesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

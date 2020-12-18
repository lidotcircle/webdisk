import { TestBed } from '@angular/core/testing';

import { RightMenuManagerService } from './right-menu-manager.service';

describe('RightMenuManagerService', () => {
  let service: RightMenuManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RightMenuManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

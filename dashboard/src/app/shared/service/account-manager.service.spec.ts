import { TestBed } from '@angular/core/testing';

import { AccountManagerService } from './account-manager.service';

describe('AccountManagerService', () => {
  let service: AccountManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccountManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

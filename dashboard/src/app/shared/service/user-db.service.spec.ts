import { TestBed } from '@angular/core/testing';

import { UserDBService } from './user-db.service';

describe('UserDBService', () => {
  let service: UserDBService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserDBService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

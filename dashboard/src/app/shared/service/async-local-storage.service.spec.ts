import { TestBed } from '@angular/core/testing';

import { AsyncLocalStorageService } from './async-local-storage.service';

describe('AsyncLocalStorageService', () => {
  let service: AsyncLocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AsyncLocalStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

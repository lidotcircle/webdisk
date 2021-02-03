import { TestBed } from '@angular/core/testing';

import { StorePassService } from './store-pass.service';

describe('StorePassService', () => {
  let service: StorePassService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorePassService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

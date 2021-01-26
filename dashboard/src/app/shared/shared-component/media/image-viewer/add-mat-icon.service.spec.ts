import { TestBed } from '@angular/core/testing';

import { AddMatIconService } from './add-mat-icon.service';

describe('AddMatIconService', () => {
  let service: AddMatIconService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddMatIconService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

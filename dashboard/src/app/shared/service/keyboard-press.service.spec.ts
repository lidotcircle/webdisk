import { TestBed } from '@angular/core/testing';

import { KeyboardPressService } from './keyboard-press.service';

describe('KeyboardPressService', () => {
  let service: KeyboardPressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KeyboardPressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

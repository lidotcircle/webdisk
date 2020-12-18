import { TestBed } from '@angular/core/testing';

import { WindowNotifierService } from './window-notifier.service';

describe('WindowNotifierService', () => {
  let service: WindowNotifierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WindowNotifierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

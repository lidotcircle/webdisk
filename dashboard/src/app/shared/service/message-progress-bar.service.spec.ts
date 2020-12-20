import { TestBed } from '@angular/core/testing';

import { MessageProgressBarService } from './message-progress-bar.service';

describe('MessageProgressBarService', () => {
  let service: MessageProgressBarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessageProgressBarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

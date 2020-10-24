import { TestBed } from '@angular/core/testing';

import { MessageEncoderService } from './message-encoder.service';

describe('MessageEncoderService', () => {
  let service: MessageEncoderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessageEncoderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { WSChannelService } from './wschannel.service';

describe('WSChannelService', () => {
  let service: WSChannelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WSChannelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

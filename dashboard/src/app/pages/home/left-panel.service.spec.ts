import { TestBed } from '@angular/core/testing';

import { LeftPanelService } from './left-panel.service';

describe('LeftPanelService', () => {
  let service: LeftPanelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeftPanelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

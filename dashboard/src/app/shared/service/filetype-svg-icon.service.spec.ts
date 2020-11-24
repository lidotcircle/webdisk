import { TestBed } from '@angular/core/testing';

import { FiletypeSvgIconService } from './filetype-svg-icon.service';

describe('FiletypeSvgIconService', () => {
  let service: FiletypeSvgIconService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FiletypeSvgIconService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

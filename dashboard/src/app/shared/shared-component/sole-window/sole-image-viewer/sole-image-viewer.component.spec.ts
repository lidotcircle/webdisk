import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoleImageViewerComponent } from './sole-image-viewer.component';

describe('SoleImageViewerComponent', () => {
  let component: SoleImageViewerComponent;
  let fixture: ComponentFixture<SoleImageViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoleImageViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoleImageViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

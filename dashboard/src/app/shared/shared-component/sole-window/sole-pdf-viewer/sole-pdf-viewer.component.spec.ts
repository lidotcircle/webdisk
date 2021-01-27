import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolePdfViewerComponent } from './sole-pdf-viewer.component';

describe('SolePdfViewerComponent', () => {
  let component: SolePdfViewerComponent;
  let fixture: ComponentFixture<SolePdfViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SolePdfViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SolePdfViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

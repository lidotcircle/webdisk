import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailViewHeaderComponent } from './detail-view-header.component';

describe('DetailViewHeaderComponent', () => {
  let component: DetailViewHeaderComponent;
  let fixture: ComponentFixture<DetailViewHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailViewHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailViewHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

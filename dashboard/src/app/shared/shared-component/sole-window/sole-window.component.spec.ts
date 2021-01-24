import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoleWindowComponent } from './sole-window.component';

describe('SoleWindowComponent', () => {
  let component: SoleWindowComponent;
  let fixture: ComponentFixture<SoleWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoleWindowComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoleWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

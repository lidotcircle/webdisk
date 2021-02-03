import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorePassComponent } from './store-pass.component';

describe('StorePassComponent', () => {
  let component: StorePassComponent;
  let fixture: ComponentFixture<StorePassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StorePassComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StorePassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

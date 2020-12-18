import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WindowToolbarComponent } from './window-toolbar.component';

describe('WindowToolbarComponent', () => {
  let component: WindowToolbarComponent;
  let fixture: ComponentFixture<WindowToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WindowToolbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WindowToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

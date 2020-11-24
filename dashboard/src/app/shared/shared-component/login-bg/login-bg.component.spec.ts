import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginBGComponent } from './login-bg.component';

describe('LoginBGComponent', () => {
  let component: LoginBGComponent;
  let fixture: ComponentFixture<LoginBGComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginBGComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginBGComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

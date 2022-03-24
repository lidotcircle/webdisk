import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubAccountsComponent } from './sub-accounts.component';

describe('SubAccountsComponent', () => {
  let component: SubAccountsComponent;
  let fixture: ComponentFixture<SubAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubAccountsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingItemComponent } from './setting-item.component';

describe('SettingItemComponent', () => {
  let component: SettingItemComponent;
  let fixture: ComponentFixture<SettingItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

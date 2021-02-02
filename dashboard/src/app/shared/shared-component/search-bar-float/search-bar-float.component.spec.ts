import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchBarFloatComponent } from './search-bar-float.component';

describe('SearchBarFloatComponent', () => {
  let component: SearchBarFloatComponent;
  let fixture: ComponentFixture<SearchBarFloatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchBarFloatComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchBarFloatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

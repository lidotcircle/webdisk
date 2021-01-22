import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageTopComponent } from './page-top.component';

describe('PageTopComponent', () => {
  let component: PageTopComponent;
  let fixture: ComponentFixture<PageTopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PageTopComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

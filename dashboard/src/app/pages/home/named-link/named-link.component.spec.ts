import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NamedLinkComponent } from './named-link.component';

describe('NamedLinkComponent', () => {
  let component: NamedLinkComponent;
  let fixture: ComponentFixture<NamedLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NamedLinkComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NamedLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

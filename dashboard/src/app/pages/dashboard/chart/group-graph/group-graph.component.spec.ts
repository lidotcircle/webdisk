import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupGraphComponent } from './group-graph.component';

describe('GroupGraphComponent', () => {
  let component: GroupGraphComponent;
  let fixture: ComponentFixture<GroupGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupGraphComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileSortComponent } from './file-sort.component';

describe('FileSortComponent', () => {
  let component: FileSortComponent;
  let fixture: ComponentFixture<FileSortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileSortComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileSortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

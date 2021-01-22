import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileOperationsComponent } from './file-operations.component';

describe('FileOperationsComponent', () => {
  let component: FileOperationsComponent;
  let fixture: ComponentFixture<FileOperationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileOperationsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileOperationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

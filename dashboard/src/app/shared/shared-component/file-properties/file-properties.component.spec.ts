import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilePropertiesComponent } from './file-properties.component';

describe('FilePropertiesComponent', () => {
  let component: FilePropertiesComponent;
  let fixture: ComponentFixture<FilePropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilePropertiesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilePropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

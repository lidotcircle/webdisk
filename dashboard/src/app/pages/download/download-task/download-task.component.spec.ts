import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadTaskComponent } from './download-task.component';

describe('DownloadTaskComponent', () => {
  let component: DownloadTaskComponent;
  let fixture: ComponentFixture<DownloadTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DownloadTaskComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

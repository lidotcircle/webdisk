import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageProgressBarComponent } from './message-progress-bar.component';

describe('MessageProgressBarComponent', () => {
  let component: MessageProgressBarComponent;
  let fixture: ComponentFixture<MessageProgressBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageProgressBarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageProgressBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

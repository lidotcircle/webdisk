import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoleVideoPlayerComponent } from './sole-video-player.component';

describe('SoleVideoPlayerComponent', () => {
  let component: SoleVideoPlayerComponent;
  let fixture: ComponentFixture<SoleVideoPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoleVideoPlayerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoleVideoPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoleAudioPlayerComponent } from './sole-audio-player.component';

describe('SoleAudioPlayerComponent', () => {
  let component: SoleAudioPlayerComponent;
  let fixture: ComponentFixture<SoleAudioPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoleAudioPlayerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoleAudioPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

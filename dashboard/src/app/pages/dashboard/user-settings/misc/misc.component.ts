import { Component, OnInit } from '@angular/core';
import { LocalSettingService } from 'src/app/service/user/local-setting.service';

@Component({
    selector: 'app-misc',
    template: `
    <app-wrapper>
      <div class='title'><div class='leader'></div><span>Websocket</span></div>
      <div class='panel'>
        <app-setting-item name='Request Timeout (s)' [extra]='{ min: 5, step: 1, type: "number" }' type='input' 
                          [(initValue)]='settings.Websocket_Request_Timeout_s'></app-setting-item>

        <app-setting-item name='Reconnect Interval Base (s)' [extra]='{ min: 1, step: 1, type: "number" }' type='input' 
                          [(initValue)]='settings.Websocket_Reconnect_Interval_s'></app-setting-item>
      </div>

      <div class='title'><div class='leader'></div><span>Group</span></div>
      <div class='panel'>
        <app-setting-item name='Delete Without Confirm' type='checkbox' 
                          [(initValue)]='settings.Group_Delete_Without_Confirm'></app-setting-item>
      </div>
    </app-wrapper>
    `,
    styleUrls: ['./misc.component.scss']
})
export class MiscComponent implements OnInit {
    settings: LocalSettingService;

    constructor(private _settings: LocalSettingService) {
        this.settings = this._settings;
    }

    ngOnInit(): void {
    }
}

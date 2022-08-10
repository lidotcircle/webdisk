import { Component, OnInit } from '@angular/core';
import { LocalSettingService } from 'src/app/service/user/local-setting.service';

@Component({
    selector: 'app-misc',
    template: `
    <app-wrapper>
    <ng-container *transloco='let t'>
      <div class='title'><div class='leader'></div><span>Websocket</span></div>
      <div class='panel'>
        <app-setting-item [name]='t("Request Timeout (s)")' [extra]='{ min: 5, step: 1, type: "number" }' type='input' 
                          [(initValue)]='settings.Websocket_Request_Timeout_s'></app-setting-item>

        <app-setting-item [name]='t("Reconnect Interval Base (s)")' [extra]='{ min: 1, step: 1, type: "number" }' type='input' 
                          [(initValue)]='settings.Websocket_Reconnect_Interval_s'></app-setting-item>
      </div>

      <div class='title'><div class='leader'></div><span>{{ t('Group') }}</span></div>
      <div class='panel'>
        <app-setting-item [name]='t("Delete Without Confirm")' type='checkbox' 
                          [(initValue)]='settings.Group_Delete_Without_Confirm'></app-setting-item>
      </div>

      <div class='title'><div class='leader'></div><span>{{ t('Markdown Editor') }}</span></div>
      <div class='panel'>
        <app-setting-item [name]='t("Saving When Leave")' type='checkbox' 
                          [(initValue)]='settings.Markdown_Editor_Saving_When_Leave'></app-setting-item>
        <app-setting-item [name]='t("Apply Local Patch")' type='checkbox' 
                          [(initValue)]='settings.Markdown_Editor_Apply_Local_Patch'></app-setting-item>
        <app-setting-item [name]='t("Attachment directory")' [extra]='{ type: "text" }' type='input' 
                          [(initValue)]='settings.Markdown_Editor_Attachment_Directory'></app-setting-item>
      </div>
    </ng-container>
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

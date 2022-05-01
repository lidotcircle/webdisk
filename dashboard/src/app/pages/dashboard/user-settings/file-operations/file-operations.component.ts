import { Component, OnInit } from '@angular/core';
import { LocalSettingService } from 'src/app/service/user/local-setting.service';

@Component({
    selector: 'app-file-operations',
    templateUrl: './file-operations.component.html',
    styleUrls: ['./file-operations.component.scss']
})
export class FileOperationsComponent implements OnInit {
    settings: LocalSettingService;

    constructor(private _settings: LocalSettingService) {
        this.settings = this._settings;
    }

    ngOnInit(): void {
    }
}

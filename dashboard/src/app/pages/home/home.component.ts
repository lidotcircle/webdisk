import { Component, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { FileStat, FileType } from 'src/app/shared/common';
import { FileSystemManagerService } from 'src/app/shared/service/file-system-manager.service';
import { InjectViewService } from 'src/app/shared/service/inject-view.service';
import { KeyboardPressService, Keycode } from 'src/app/shared/service/keyboard-press.service';
import { Subscription } from 'rxjs';
import { CurrentDirectoryService } from 'src/app/shared/service/current-directory.service';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';
import { cons, downloadURI } from 'src/app/shared/utils';
import { MenuEntry, RightMenuManagerService } from 'src/app/shared/service/right-menu-manager.service';
import { MessageBoxService } from 'src/app/shared/service/message-box.service';


@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    constructor(private contextmenu: RightMenuManagerService,
                private cwd: CurrentDirectoryService,
                private messagebox: MessageBoxService) {
        this.contextmenu.StartContextMenu();
    }

    ngOnInit(): void {
        setTimeout(() => {
            this.messagebox.create({
                message: 'hello world',
                title: 'hello',
                buttons: [
                    {name: 'ok'},
                    {name: 'cancal'}
                ],
                inputs: [
                    {label: 'youxi', name: 'i1', type: 'text'},
                    {label: 'youxi', name: 'l1', type: 'text'}
                ]
            }).wait().then(() => {
                console.log("okkk");
            });
        }, 1);
    }
}


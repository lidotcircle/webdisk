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
import { NotifierService } from 'src/app/shared/service/notifier.service';
import { MousePointerService } from 'src/app/shared/service/mouse-pointer.service';
import { MessageProgressBarService } from 'src/app/shared/service/message-progress-bar.service';


@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    constructor(private contextmenu: RightMenuManagerService,
                private cwd: CurrentDirectoryService,
                private notifier: NotifierService,
                private mousepointer: MousePointerService,
                private messagebox: MessageBoxService,
                private messageprogress: MessageProgressBarService) {
        this.contextmenu.StartContextMenu();
        this.mousepointer.coordinate;
    }

    ngOnInit(): void {}
}


import { Component, OnInit, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { Life } from 'src/app/shared/utils';
import { RightMenuManagerService } from 'src/app/shared/service/right-menu-manager.service';
import { Tool, ToolbarService, ToolType } from './file-view/toolbar.service';
import { LeftPanelService } from './left-panel.service';
import { DirectoryTreeComponent } from './directory-tree/directory-tree.component';
import { ActivatedRoute } from '@angular/router';
import { FileViewComponent } from './file-view/file-view.component';


@Component({
    selector: 'app-explorer',
    templateUrl: './explorer.component.html',
    styleUrls: ['./explorer.component.scss'],
})
export class ExplorerComponent implements OnInit, OnDestroy {
    private paramsSub: Subscription;
    constructor(private contextmenu: RightMenuManagerService,
                private activatedRouter: ActivatedRoute,
                private toolbar: ToolbarService,
                private leftpanelservice: LeftPanelService)
    {
        this.contextmenu.StartContextMenu();
    }

    ngOnDestroy(): void {
        this.life.die();
        this.paramsSub.unsubscribe();
    }

    private life: Life = new Life();
    @ViewChild('panel', {static: true})
    private leftpanel: ElementRef;

    @ViewChild('tree', {static: true})
    private dir_tree: DirectoryTreeComponent;

    @ViewChild('fileview', {static: true})
    private fileview: FileViewComponent;

    ngOnInit(): void {
        this.leftpanelservice.initialize(this.leftpanel.nativeElement);
        const panelToggle = new Tool('Panel', 'menu', false, () => {
            this.leftpanelservice.toggle();
        });
        panelToggle.cssclass = 'panel-button';
        this.toolbar.register(ToolType.Navigation, panelToggle, this.life);
        this.dir_tree.onGet();

        this.paramsSub = this.activatedRouter.queryParamMap.subscribe(async (paramsMap) => {
            const path = paramsMap.get('path') || '/';;
            await this.fileview.chdir(path);
        });
    }
}

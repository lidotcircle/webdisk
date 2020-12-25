import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CurrentDirectoryService } from 'src/app/shared/service/current-directory.service';
import { FileSystemManagerService } from 'src/app/shared/service/file-system-manager.service';
import { path } from 'src/app/shared/utils';
import { FileType } from '../../../../../../lib/common/file_types';
import { LeftPanelService } from '../left-panel.service';

@Component({
    selector: 'app-directory-tree',
    templateUrl: './directory-tree.component.html',
    styleUrls: ['./directory-tree.component.scss']
})
export class DirectoryTreeComponent implements OnInit {
    @Input()
    private directory: string;
    private _expanded: boolean = false;
    children: string[];

    get basename() {
        let ans = path.basename(this.directory);
        if(ans.length == 0) ans = '/';
        return ans;
    }
    get expanded() {return this._expanded;}

    constructor(private filesystem: FileSystemManagerService,
                private cwd: CurrentDirectoryService,
                private leftpanel: LeftPanelService) { 
        this.children = [];
    }

    @ViewChild('tree', {static: true})
    private tree_elem: ElementRef;
    private toggle_wait() {
        const elem = this.tree_elem.nativeElement as HTMLElement;
        elem.classList.toggle('wait');
    }

    ngOnInit(): void { }

    private _geted = false;
    private in_get = false;
    get geted() {return this._geted;}
    async onGet() {
        if(this.in_get) return;

        if(!this.geted) {
            try {
                this.in_get = true;
                this.toggle_wait();
                const ans = await this.filesystem.getdir(this.directory);
                ans.forEach(file => {
                    if(file.filetype == FileType.dir) {
                        this.children.push(file.filename);
                    }
                });
                this._geted = true;
            } finally {
                this.toggle_wait();
                this.in_get = false;
            }
        }

        this._expanded = !this._expanded;
    }

    /*
    private doubleClickGotoTimeSpan = 200;
    private prev = 0;
    onGoto() {
        if((Date.now() - this.prev) < this.doubleClickGotoTimeSpan) {
            this.cwd.cd(this.directory);
            this.prev = 0;
        } else {
            this.prev = Date.now();
        }
    }
    */
    onGoto() {
        this.cwd.cd(this.directory);
        this.leftpanel.toggle();
    }
}


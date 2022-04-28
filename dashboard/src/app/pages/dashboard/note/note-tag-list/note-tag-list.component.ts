import { Component, OnInit } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
import { NoteService } from 'src/app/service/note/note.service';
import onChange from 'on-change';
import { AsyncLocalStorageService } from 'src/app/shared/service/async-local-storage.service';
import { Router } from '@angular/router';


interface PageConfig {
    filter: string;
    sortBy: string;
    ascending: boolean;
};


@Component({
    selector: 'app-note-tag-list',
    template: `
    <nb-card>
        <nb-card-header>
            <nb-radio-group [(ngModel)]="config.sortBy" class='sortby'>
                <nb-radio value="name">Name</nb-radio>
                <nb-radio value="createdAt">CreatedTime</nb-radio>
            </nb-radio-group>
            <div>
                <span class='lable'>Filter: </span>
                <input nbInput class='filter' status='primary' type='text' [(ngModel)]='config.filter'>
            </div>
            <nb-checkbox [(ngModel)]='config.ascending'>Ascending</nb-checkbox>
        </nb-card-header>
        <nb-card-body>
            <div class='tags'>
                <div *ngFor='let tag of tags; let i = index;' class='tag'>
                    <nb-icon icon='star'></nb-icon>
                    <a (click)='onTagClick(i)'>{{ tag }}</a>
                </div>
            </div>
        </nb-card-body>
    </nb-card>

    `,
    styleUrls: ["./note-tag-list.component.scss"]
})
export class NoteTagListComponent implements OnInit {
    private allTags: string[];
    tags: string[];
    config: PageConfig;

    constructor(private noteService: NoteService,
                private toastr: NbToastrService,
                private router: Router,
                private localstorage: AsyncLocalStorageService)
    {
        const config: PageConfig = {} as any;
        config.sortBy = 'name';
        config.ascending = true;
        this.config = this.watchConfig(config);
        this.tags = [];
    }

    private watchConfig(config: PageConfig): PageConfig {
        return onChange(config, async () => {
            await this.saveConfig();
            this.refresh();
        }, {
            isShallow: true,
        });
    }

    private async saveConfig() {
        const newobj = Object.assign({}, this.config);
        await this.localstorage.set("tag-list-config", newobj);
    }

    private async restoreConfig() {
        const config = await this.localstorage.get<PageConfig>("tag-list-config");
        if (config) {
            this.config = this.watchConfig(config);
        }
    }

    private refresh() {
        this.tags = this.allTags.slice()
        if (this.config.sortBy == 'name') {
            this.tags.sort((a, b) => a.localeCompare(b));
        }

        if (this.config.filter != null && this.config.filter != '') {
            const reg = new RegExp(this.config.filter);
            this.tags = this.tags.filter(v => reg.test(v));
        }

        if (!this.config.ascending) {
            this.tags.reverse();
        }
    }

    ngOnInit(): void {
        this.fetchTags();
    }

    onTagClick(n: number) {
        const tag = this.tags[n];
        this.router.navigate(["/wd/dashboard/note/notes-of-tag"], {
            queryParams: { tag }
        });
    }

    async fetchTags() {
        try {
            await this.restoreConfig();
            this.allTags = await this.noteService.getTags();
            this.refresh();
        } catch {
            this.toastr.danger("get tags failed", "Note");
        }
    }
}

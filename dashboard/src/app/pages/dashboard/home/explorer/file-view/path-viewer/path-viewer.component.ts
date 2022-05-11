import { Component, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { interval, Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { LocalSettingService } from 'src/app/service/user/local-setting.service';
import { CurrentDirectoryService } from 'src/app/shared/service/current-directory.service';


@Component({
    selector: 'app-path-viewer',
    template: `
    <div *ngIf='showNav' class='path-viewer'>
        <div *ngIf='!editorMode' class="component-container" #cn>
            <span class='home'>
                <a (click)='gotoEditor()'><nb-icon icon='desktop'></nb-icon></a>
                <span *ngIf='!overflow'><nb-icon icon='angle-right'></nb-icon></span>
                <span *ngIf='overflow'> <nb-icon icon='angles-right'></nb-icon></span>
            </span>

            <span *ngFor="let component of directory_components; let i = index">
                <a (click)='handleClick(i)'> {{ component }} </a>
                <nb-icon class='icon' icon='angle-right'></nb-icon>
            </span>
        </div>
        <div *ngIf='editorMode' class='path-editor'>
            <input type='text' (blur)='handleEnter()' (keydown.enter)='handleEnter()' [(ngModel)]='editor_directory' #input/>
        </div>
    </div>`,
    styleUrls: ['./path-viewer.component.scss'],
})
export class PathViewerComponent implements OnInit, OnChanges, OnDestroy {
    private directory: string;
    editor_directory: string;

    directory_components: string[] = [];
    editorMode: boolean = false;
    overflow: boolean = false;
    showNav: boolean = true;

    @ViewChild('cn', {static: false})
    private element: ElementRef;
    @ViewChild('input', {static: false})
    private inputElement: ElementRef;

    private destroy$: Subject<void> = new Subject();

    constructor(private cwdService: CurrentDirectoryService,
                private settings: LocalSettingService)
    {
        this.showNav = this.settings.Explorer_Show_Directory_Navigator;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.directory.currentValue) {
            this.setPath(changes.directory.currentValue);
        }
    }

    ngOnInit(): void {
        this.cwdService.betterCWD
            .pipe(takeUntil(this.destroy$))
            .subscribe(async (dir: string) => {
                this.directory = dir;
                await this.setPath(dir);
            });
    }

    async gotoEditor() {
        this.editor_directory = this.directory;
        this.editorMode = true;

        await interval(10)
            .pipe(
                takeUntil(this.destroy$),
                take(200), 
                filter(() => !!this.inputElement?.nativeElement?.offsetWidth),
                take(1))
            .toPromise();

        const input = this.inputElement.nativeElement as HTMLInputElement;
        input.select();
        input.focus();
    }

    handleEnter() {
        this.editorMode = false;

        if (this.editor_directory == '' ||
            this.editor_directory == this.directory)
        {
            return;
        }

        if (this.editor_directory.startsWith('/')) {
            this.cwdService.cd(this.editor_directory);
        }
    }

    async handleClick(index: number): Promise<void> {
        if (index === this.directory_components.length - 1) {
            return;
        }

        const components = this.getComponents(this.directory);
        const target = components.slice(0, index + 1 + components.length - this.directory_components.length);
        this.cwdService.cd('/' + target.join('/'));
    }

    private getComponents(path: string): string[] {
        return (path || '').split('/').filter(component => component !== '');
    }

    private async setPath(path: string): Promise<void> {
        this.editorMode = false;
        this.overflow = false;
        this.directory_components = this.getComponents(path);

        await interval(10)
            .pipe(
                takeUntil(this.destroy$),
                take(200), 
                filter(() => !!this.element?.nativeElement?.offsetWidth),
                take(1))
            .toPromise();

        const elem = this.element.nativeElement as HTMLElement;
        const parent = elem.parentElement;
        if (elem.clientWidth > parent.clientWidth && this.directory_components.length > 2) {
            this.overflow = true;
            const children = elem.children;
            let width = elem.clientWidth;

            for (let i=0;i<this.directory_components.length-2;i++) {
                const child = children[i+1];
                width -= child.clientWidth;
                if (width < parent.clientWidth) {
                    this.directory_components = this.directory_components.slice(i+1);
                    break;
                }
            }
        }
    }
}


import { AfterViewChecked, AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { DownloadTask } from 'src/app/shared/common';
import { ClipboardContentType, ClipboardService } from 'src/app/shared/service/clipboard.service';
import { DownloadManagerService } from 'src/app/shared/service/download/download-manager.service';
import { MessageBoxService } from 'src/app/shared/service/message-box.service';
import { NotifierService } from 'src/app/shared/service/notifier.service';
import { Convert } from 'src/app/shared/utils';

@Component({
    selector: 'app-download-task',
    templateUrl: './download-task.component.html',
    styleUrls: ['./download-task.component.scss']
})
export class DownloadTaskComponent implements OnInit, AfterViewInit {
    @Input('task')
    task: DownloadTask;

    @ViewChild('nameElem', {static: true})
    private nameElem: ElementRef;
    @ViewChild('urlElem', {static: true})
    private urlElem: ElementRef;

    private _url_overflow: boolean = false;
    private _name_overflow: boolean = false;
    get UrlOverflow()  {return this._url_overflow;}
    get NameOverflow() {return this._name_overflow;}
    private refreshOverflowInfo() {
        const namee = this.nameElem.nativeElement as HTMLElement;
        const urle  = this.urlElem.nativeElement as HTMLElement;
        this._name_overflow = namee.clientWidth != namee.scrollWidth;
        this._url_overflow  = urle.clientWidth  != urle.scrollWidth;
    }

    get percent(): number {
        return 100 * (this.task.size ? this.task.downloaded / this.task.size : 0);
    }

    get PropSize(): string {
        return this.task.size ? Convert.bv2str(this.task.size) : 'Unknown';
    }

    get PropDownloaded(): string {
        return Convert.bv2str(this.task.downloaded || 0);
    }

    get PropPartial(): string {
        return this.task.partial ? 'True' : 'False';
    }

    private speedGenerator: Convert.TrafficSpeedGenerate = new Convert.TrafficSpeedGenerate();
    private prevSize = 0;
    get PropSpeed(): string {
        const diff = Math.max(this.task.size - this.prevSize, 0);
        this.prevSize = this.task.size;
        if(diff > 0) this.speedGenerator.push(diff);
        return this.speedGenerator.speed;
    }

    constructor(private clipboard: ClipboardService,
                private notifier: NotifierService,
                private messagebox: MessageBoxService,
                private downloadmanager: DownloadManagerService) {
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.refreshOverflowInfo(), 0);
    }

    ngAfterViewChecked(): void {
    }

    ngOnInit(): void {
    }

    async deleteTask() {
        const u = await this.messagebox.create({
            title: 'delete task',
            message: `are you sure delete task ${this.task.name}`,
            buttons: [
                {name: 'Confirm'},
                {name: 'Cancel'}
            ]
        }).wait();

        if(!u.closed && u.buttonValue == 0) {
            await this.downloadmanager.deleteTaskWithUI(this.task.taskId);
        }
    }

    async copyUrl() {
        await this.clipboard.copy(ClipboardContentType.text, this.task.url);
        await this.notifier.create({message: 'copy url to clipboard'}).wait();
    }

    async copyName() {
        await this.clipboard.copy(ClipboardContentType.text, this.task.name);
        await this.notifier.create({message: 'copy name to clipboard'}).wait();
    }
}


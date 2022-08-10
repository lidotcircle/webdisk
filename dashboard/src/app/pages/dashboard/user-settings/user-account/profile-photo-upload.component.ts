import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { NbToastrService, NbWindowRef } from '@nebular/theme';
import { TranslocoService } from '@ngneat/transloco';
import { OpenSystemChooseFilesService } from 'src/app/shared/service/open-system-choose-files.service';


@Component({
    template: `
    <ng-container *transloco='let t'>
    <div class="message" *ngIf='message'>{{ message }}</div>
    <div class="photo-upload">
        <div class="photo">
            <div class="photo-wrapper">
                <img [class]='isHeighter ? "photo-heighter" : "photo-widther"' (load)='imageLoaded()' [src]='photo' [alt]="t('empty')" #profileImg>
            </div>
        </div>
        <div class="upload">
            <button nbButton fullWidth status='info' (click)="uploadPhoto()">{{ t('Upload') }}</button>
        </div>
    </div>
    <div class="buttons">
        <button nbButton status='primary' (click)="confirm()" hero [disabled]='!isUploaded'>{{ t('Confirm') }}</button>
        <button nbButton status='primary' (click)="cancel()"  outline>{{ t('Cancel') }}</button>
    </div>
    </ng-container>
    `,
    styles: [
        `
        .message, .photo-upload {
            padding: 0em 0em 1.7em 0em;
            font-weight: bold;
        }
        .photo-upload {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .photo {
            padding: 2em;
        }
        .upload {
            width: 80%;
        }
        .photo .photo-wrapper {
            position: relative;
            width: 250px;
            height: 250px;
            overflow: hidden;
            border-radius: 50%;
            border: 1.5pt solid #ccc;
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            align-items: center;
        }
        .photo .photo-wrapper img {
            position: absolute;
        }
        .photo-heighter {
            width: 100%;
        }
        .photo-widther {
            height: 100%;
        }
        .buttons {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
        }`,
    ],
})
export class ProfilePhotoUploadComponent implements OnInit {
    @Input()
    message: string;
    @Input()
    photo: string;
    isUploaded: boolean = false;
    isHeighter: boolean = false;

    @ViewChild('profileImg', {static: true})
    private image: ElementRef;

    constructor(private windowRef: NbWindowRef,
                private fileChooser: OpenSystemChooseFilesService,
                private translocoService: TranslocoService,
                private toastService: NbToastrService) {}

    @HostListener('document:paste', ['$event'])
    async handleCtrlV(event: ClipboardEvent) {
        if (event.type != 'paste') return;
        if (event.clipboardData.items.length == 0) return;
        const firstItem = event.clipboardData.items[0];
        if (firstItem.kind != 'file' || !firstItem.type.startsWith("image")) return;

        const file = firstItem.getAsFile();
        await this.uploadPhoseFile(file);
    }

    ngOnInit() {
        this.photo = this.photo;
    }

    isConfirmed: boolean = false;
    confirm() {
        this.isConfirmed = true;
        this.windowRef.config.context['isConfirmed'] = true;
        this.windowRef.close();
    }

    cancel() {
        this.isConfirmed = false;
        this.windowRef.config.context['isConfirmed'] = false;
        this.windowRef.close();
    }

    async uploadPhoto() {
        const file = await this.fileChooser.getFile(".png,.jpg,.gif");
        await this.uploadPhoseFile(file.file);
    }

    private async uploadPhoseFile(file: File) {
        const buffer = await file.slice().arrayBuffer();
        if(buffer.byteLength > 5 * 1024 * 1024) {
            this.toastService.danger(
                this.translocoService.translate("image size is too big"),
                this.translocoService.translate("Avatar"));
        } else {
            this.isUploaded = true;
            this.photo = 'data:' + file.type + ';base64,' + this.arrayBufferToBase64(buffer);
            this.windowRef.config.context['photo'] = this.photo;
        }
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        let bytes = new Uint8Array( buffer );
        let len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode( bytes[ i ] );
        }
        return window.btoa( binary );
    }

    imageLoaded() {
        if (!this.image || !this.image.nativeElement) return;
        const html = this.image.nativeElement as HTMLElement;
        this.isHeighter = html.clientHeight > html.clientWidth;
    }
}

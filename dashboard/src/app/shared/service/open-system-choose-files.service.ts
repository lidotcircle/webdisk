import { Injectable } from '@angular/core';
import { createNodeFromHtmlString, FileSystemEntryWrapper } from '../utils';

const chooserTimeout = 2 * 60 * 1000;

@Injectable({
    providedIn: 'root'
})
export class OpenSystemChooseFilesService {
    constructor() { }

    private async getFileInputByAttribute(attr: string, accept?: string): Promise<FileSystemEntryWrapper[]> //{
    {
        const dirinput = `<input type="file" ${attr} ${accept ? "accept='" + accept + "'" : ''}>`;
        const input = createNodeFromHtmlString(dirinput);
        document.body.appendChild(input);
        input.style.display = 'none';

        return await new Promise((resolve, reject) => {
            let finish = false;

            input.oninput = (ev: Event) => {
                if(finish) return;
                finish = true;

                const entries = FileSystemEntryWrapper.fromListOfFiles((ev.target as any).files as File[]);
                resolve(entries);
            }

            setTimeout(() => {
                if(!finish) {
                    reject(new Error('chooser dialog timeout'));
                    finish = true;
                }
            }, chooserTimeout);
            input.click();
        });
    } //}

    async getFiles(accpet?: string): Promise<FileSystemEntryWrapper[]> {
        return await this.getFileInputByAttribute('multiple', accpet);
    }

    async getFile(accept?: string): Promise<FileSystemEntryWrapper> {
        return (await this.getFileInputByAttribute('', accept))[0];
    }

    async getDirectory(): Promise<FileSystemEntryWrapper> {
        return (await this.getFileInputByAttribute('webkitdirectory'))[0];
    }
}


import { PluginContext, I18n } from '@toast-ui/editor/types/editor';
import { PluginInfo } from '@toast-ui/editor/types';
import { Editor } from '@toast-ui/editor/types';
import { ToolbarCustomOptions } from '@toast-ui/editor/types/ui';
import { EditorView } from 'prosemirror-view';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Injector } from '@angular/core';
import { FileOperationService } from 'src/app/shared/service/file-operation.service';
import { NbToastrService } from '@nebular/theme';
import { interval, Subject, Subscription } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Note } from 'src/app/service/note/note.service';
import { FileSystemManagerService } from 'src/app/shared/service/file-system-manager.service';
import { FileLinkService } from 'src/app/service/file-link.service';
import { HTMLConvertor, HTMLToken, MdNode, Context, HTMLConvertorMap } from '@toast-ui/editor/types/toastmark';

const styleElement = document.createElement('style');
declare const require: any;
styleElement.innerHTML = require('./upload-plugin.scss');
document.head.appendChild(styleElement);


function simulateKey(view: any, keyCode: number, key: string) {
    const event = document.createEvent("Event") as any;
    event.initEvent("keydown", true, true);
    event.keyCode = keyCode
    event.key = event.code = key
    return view.someProp("handleKeyDown", (f: any) => f(view, event))
}

interface UploadPanelProps {
    children?: any;
    injector: Injector;
    viewGetter: () => EditorView;
    noteGetter: () => Note;
    onDone: () => void;
};
class UploadPanelComponent extends React.Component<UploadPanelProps, {uploading: boolean}> {
    private destroy$: Subject<void> = new Subject();
    private prevDragOver: Date;

    constructor(props: UploadPanelProps) {
        super(props);
        this.state = {
            uploading: false,
        };
    }

    private subscription: Subscription;
    private setupClearInterval() {
        this.prevDragOver = new Date();
        if (this.subscription)
            return;

        this.subscription = interval(100)
            .pipe(
                takeUntil(this.destroy$),
                filter(() => this.state.uploading && this.prevDragOver && new Date().getTime() - this.prevDragOver.getTime() > 100))
            .subscribe(() => {
                this.setState({
                    uploading: false,
                });
                this.subscription.unsubscribe();
                this.subscription = null;
            });
    }

    private get view(): EditorView {
        return this.props.viewGetter();
    }

    private get fileManager(): FileSystemManagerService {
        return this.props.injector.get(FileSystemManagerService);
    }

    private get fileLink(): FileLinkService {
        return this.props.injector.get(FileLinkService);
    }

    private get fileOperation(): FileOperationService {
        return this.props.injector.get(FileOperationService);
    }

    private get toastr(): NbToastrService {
        return this.props.injector.get(NbToastrService);
    }

    private handleDragOver (e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();

        this.setupClearInterval();
        if (!this.state.uploading) {
            this.setState({
                uploading: true,
            });
        }
    }

    private insertImageLink(filename: string, link: string) {
        if (link == null) {
            const tr = this.view.state.tr;
            const { from } = this.view.state.selection;
            tr.insertText(`![${filename}](${link})\n`, from);
            this.view.dispatch(tr);
            this.view.focus();
        } else {
            const info = {} as any;
            info.url = link;
            info.caption = filename;
            info.centering = true;

            const text = `\n$$attachment\n${JSON.stringify(info, null, 2)}\n$$`;
            text.split('\n').forEach((line) => {
                if (line.length > 0) {
                    const tr = this.view.state.tr;
                    const { from } = this.view.state.selection;
                    tr.insertText(line, from);
                    this.view.dispatch(tr);
                }
                simulateKey(this.view, 13, 'Enter');
            });
        }
    }

    private async handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        const items = e.dataTransfer.items;
        if (items.length != 1) {
            this.toastr.danger('Please select one file', "upload");
            return;
        }

        const entry = items[0].webkitGetAsEntry();
        if (!entry.isFile) {
            this.toastr.danger('Please select one file', "upload");
            return;
        }
        const note = this.props.noteGetter();
        if (!note || note.id == null) {
            this.toastr.danger('note a valid note', "upload");
            return;
        }

        try {
            const filedir = `/note-attachment/note${note.id}/`;
            const filename = entry.name;
            if (!await this.fileManager.stat(filedir).then(() => true, () => false)) {
                await this.fileManager.mkdir(filedir);
            }
            await this.fileOperation.upload([ entry ], filedir);

            const fullpath = `${filedir}${filename}`;
            if (!await this.fileManager.stat(fullpath).then(() => true, () => false)) {
                throw new Error("file not found");
            }

            const link = await this.fileLink.newlink(fullpath, true);
            this.insertImageLink(filename, link);
        } catch (e) {
            console.error(e);
            this.toastr.danger(e.message || 'failed', "upload");
        } finally {
            this.props.onDone();
        }
    }

    render() {
        return <div className='upload-panel' 
                   onDrop={ this.handleDrop.bind(this) }
                   onDragOver={ this.handleDragOver.bind(this) }>
                   Upload Image
               </div>
    }

    unmount() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}


function addLangs(_i18n: I18n) {
}

const attachmentConvertor: HTMLConvertor = (node: MdNode, _ccontext: Context, _convertors: HTMLConvertorMap) => {
    const info: { url: string, centering: boolean, caption: string } = {} as any;
    try {
        const obj = JSON.parse(node.literal);
        Object.assign(info, obj);
        if (!info.url) {
            throw new Error("url not found");
        }
    } catch (e) {
        return [
            { type: 'openTag', tagName: 'div', attributes: { style: 'color: red; text-align: center; font-size: large;' } },
            { type: 'text', content: `invalid attachment, ${e.message}` },
            { type: 'closeTag', tagName: 'div' },
        ];
    }

    const ans: HTMLToken[] = [
        { type: 'openTag', tagName: 'div', attributes: { style: `display: flex; flex-direction: column; ${info.centering ? 'align-items: center;' : ''}` } },
        { type: 'openTag', tagName: 'img', attributes: { src: info.url } },
        { type: 'closeTag', tagName: 'img' },
    ];
    if (info.caption) {
        ans.push({ type: 'openTag', tagName: 'div', attributes: { style: 'font-size: small;' } })
        ans.push({ type: 'text', content: info.caption });
        ans.push({ type: 'closeTag', tagName: 'div' });
    }

    ans.push({ type: 'closeTag', tagName: 'div' });
    return ans;
};

export default function UploadPlugin(context: PluginContext, options: any): PluginInfo {
    options = options || {};
    const { i18n, eventEmitter } = context;
    const { editorGetter, injector, noteGetter } = options;
    // TODO i18n
    addLangs(i18n);

    const viewGetter = () => {
        const editor: Editor = editorGetter();
        if (editor && (editor as any).mdEditor) {
            return  (editor as any).mdEditor.view as EditorView;
        } else {
            return null;
        }
    }

    const container = document.createElement('div');
    container.classList.add('attachment-upload-panel');
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
        <UploadPanelComponent
            injector={ injector }
            viewGetter={ viewGetter }
            noteGetter={ noteGetter }
            onDone={ () => eventEmitter.emit('closePopup') }>
        </UploadPanelComponent>
        </React.StrictMode>
    );

    const icon = document.createElement('div');
    icon.innerHTML = "<i class='fa fa-paperclip'></i>";
    const tool: ToolbarCustomOptions = {
        hidden: false,
        name: 'upload',
        el: icon,
        popup: {
            body: container,
            style: { width: 'auto' }
        },
        tooltip: 'Attachment Upload',
    };

    const toHTMLRenderers = {
        attachment: attachmentConvertor,
    }

    return {
        toHTMLRenderers,
        toolbarItems: [
            {
                groupIndex: 1,
                itemIndex: 3,
                item: tool,
            }
        ]
    };
}

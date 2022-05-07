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
import { FileSystemEntryWrapper } from 'src/app/shared/FileSystemEntry';
import { OpenSystemChooseFilesService } from 'src/app/shared/service/open-system-choose-files.service';

function simulateKey(view: any, keyCode: number, key: string) {
    const event = document.createEvent("Event") as any;
    event.initEvent("keydown", true, true);
    event.keyCode = keyCode
    event.key = event.code = key
    return view.someProp("handleKeyDown", (f: any) => f(view, event))
}

function randomString(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

interface UploadPanelProps {
    children?: any;
    injector: Injector;
    editorGetter: () => Editor;
    viewGetter: () => EditorView;
    noteGetter: () => Note;
    onDone: () => void;
};
interface PanelState {
    dragover?: boolean;
    centering?: boolean;
    uploading?: boolean;
    caption?: string;
    width?: string;
}
class UploadPanelComponent extends React.Component<UploadPanelProps, PanelState> {
    private destroy$: Subject<void> = new Subject();
    private prevDragOver: Date;

    constructor(props: UploadPanelProps) {
        super(props);
        this.state = {
            width: 'auto',
            centering: true,
        };
    }

    private changeStateKey(key: string, value: any) {
        this.setState({
            ...this.state,
            [key]: value
        });
    }

    private subscription: Subscription;
    private setupClearInterval() {
        this.prevDragOver = new Date();
        if (this.subscription)
            return;

        this.subscription = interval(100)
            .pipe(
                takeUntil(this.destroy$),
                filter(() => this.state.dragover && this.prevDragOver && new Date().getTime() - this.prevDragOver.getTime() > 100))
            .subscribe(() => {
                this.setState({
                    dragover: false,
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

    private handleDragOver(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();

        if (this.state.uploading) return;
        this.setupClearInterval();
        if (!this.state.dragover) {
            this.setState({
                dragover: true,
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
            info.caption = this.state.caption;
            info.centering = true;
            info.width = this.state.width;

            const text = `\n$$attachment\n${JSON.stringify(info, null, 2)}\n$$\n`;

            if (text.length > 2) {
                this.props.editorGetter().insertText(text);
            } else {
                // TODO
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
    }

    private async handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        if (this.state.uploading) return;
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

        await this.newAttachment(entry);
    }

    private async newAttachment(entry: any) {
        const note = this.props.noteGetter();
        if (!note || note.id == null) {
            this.toastr.danger('note a valid note', "upload");
            return;
        }

        try {
            this.changeStateKey('uploading', true);
            const filedir = `/note-attachment/note${note.id}/`;
            const filename = entry.name;
            if (!await this.fileManager.stat(filedir).then(() => true, () => false)) {
                await this.fileManager.mkdir(filedir);
            }
            await this.fileOperation.upload([entry], filedir);

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
            this.changeStateKey('uploading', false);
        }
    }

    private async handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        if (this.state.uploading) return;
        const items = e.clipboardData.items;
        if (items.length != 1) {
            this.toastr.danger('bad paste data, 0 length', "upload");
            return;
        }

        const file = items[0].getAsFile();
        if (!file) {
            this.toastr.danger('bad paste data', "upload");
            return;
        }

        const imagename = `${randomString(10)}${file.name}`;
        const entry = FileSystemEntryWrapper.fromFile(file, imagename);
        await this.newAttachment(entry);
    }

    private async handleDoubleClick() {
        if (this.state.uploading) return;

        const chooser = this.props.injector.get(OpenSystemChooseFilesService);
        const file = await chooser.getFile("image/*");
        await this.newAttachment(file);
    }

    render() {
        const toolStyle: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '0.5em',
        };
        const labelStyle: React.CSSProperties = {
            margin: '0em',
            padding: '0.5em',
            minWidth: '5em',
        };

        return <div
            style={{
                width: 'auto',
                maxWidth: '50vh',
                height: 'auto',
                minHeight: '20vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: this.state.dragover ? '1' : '0.7'
            }}
            onPaste={this.handlePaste.bind(this)}
            onDrop={this.handleDrop.bind(this)}
            onDragOver={this.handleDragOver.bind(this)}>
            <div style={{ fontWeight: 'bold', fontSize: 'large', userSelect: 'none', cursor: 'pointer' }}
                onDoubleClick={ this.handleDoubleClick.bind(this) }>
                Upload Attachment
            </div>
            {this.state.uploading
                ?
                <div style={{ fontSize: 'large', marginTop: '2em' }}>
                    Uploading...
                </div>
                :
                <div style={{
                    padding: '1em',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                }}>
                    <span style={toolStyle}>
                        <label style={labelStyle}>Caption</label>
                        <input type='text' value={this.state.caption} onChange={e => {
                            this.changeStateKey('caption', e.target.value);
                        }} />
                    </span>
                    <span style={toolStyle}>
                        <label style={labelStyle}>Width</label>
                        <input type='text' value={this.state.width} onChange={e => {
                            this.changeStateKey('width', e.target.value);
                        }} />
                    </span>

                    <span style={toolStyle}>
                        <label style={labelStyle}>Centering</label>
                        <input type='checkbox' checked={this.state.centering} onChange={e => {
                            this.changeStateKey('centering', e.target.checked);
                        }} />
                    </span>
                </div>
            }
        </div>
    }

    unmount() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}


function addLangs(_i18n: I18n) {
}

export default function UploadPlugin(context: PluginContext, options: any): PluginInfo {
    options = options || {};
    const { i18n, eventEmitter } = context;
    const { editorGetter, injector, noteGetter } = options;
    // TODO i18n
    addLangs(i18n);

    const viewGetter = () => {
        const editor: Editor = editorGetter();
        if (editor && (editor as any).mdEditor) {
            return (editor as any).mdEditor.view as EditorView;
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
                injector={injector}
                editorGetter={editorGetter}
                viewGetter={viewGetter}
                noteGetter={noteGetter}
                onDone={() => eventEmitter.emit('closePopup')}>
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

    const attachmentConvertor: HTMLConvertor = (node: MdNode, _ccontext: Context, _convertors: HTMLConvertorMap) => {
        const info: { url: string, centering: boolean, caption: string, width: string } = {} as any;
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

        const style = `
            display: flex;
            flex-direction: column;
            ${info.centering ? 'align-items: center;' : ''}
        `
        const imageStyle = `
            ${info.width ? `width: ${info.width};` : ''}
        `;
        const ans: HTMLToken[] = [
            { type: 'openTag', tagName: 'div', attributes: { style } },
            { type: 'openTag', tagName: 'img', attributes: { src: info.url, style: imageStyle } },
            { type: 'closeTag', tagName: 'img' },
        ];
        if (info.caption) {
            const editor: Editor = editorGetter();
            const plugins: PluginInfo = (editor as any)?.pluginInfo;
            const textRenderer = plugins?.toHTMLRenderers?.text;
            ans.push({ type: 'openTag', tagName: 'div', attributes: { style: 'font-size: small;' } })
            if (textRenderer) {
                const op = (textRenderer as any)({ literal: info.caption } as any, _ccontext, _convertors);
                ans.push(...op);
            } else {
                ans.push({ type: 'text', content: info.caption });
            }
            ans.push({ type: 'closeTag', tagName: 'div' });
        }

        ans.push({ type: 'closeTag', tagName: 'div' });
        return ans;
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

import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbThemeService, NbToastrService } from '@nebular/theme';
import { interval, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Note, NoteService } from 'src/app/service/note/note.service';
import { ObjectSharingService } from 'src/app/service/object-sharing.service';
import { MessageBoxService } from 'src/app/shared/service/message-box.service';
import { downloadURI, nbThemeIsDark } from 'src/app/shared/utils';
import { Parser as TUIParser } from '@toast-ui/editor/types/toastmark';
import html2canvas from 'html2canvas';
import { GenerateHeadingInfo, GetHeadingNodeInfo, ReGenerateHeadingInfo } from '../markdown-heading';
import { TOCItem } from './table-of-content.component';
import { TuiViewerComponent } from 'src/app/shared/shared-component/toast-ui/tui-viewer/tui-viewer.component';
import { Viewer } from '@toast-ui/editor/types';
import { HTMLConvertor, HeadingMdNode } from '@toast-ui/editor/types/toastmark';
import { MergeTextRenderer } from 'src/app/shared/shared-component/toast-ui/MergeTextRendererPlugin';
import { emojiConvertor } from 'src/app/shared/shared-component/toast-ui/EmojiPlugin';
import { inlineLatexConvertor } from 'src/app/shared/shared-component/toast-ui/LatexPlugin';
import { LocalSettingService } from 'src/app/service/user/local-setting.service';
declare const require: any;
const Parser = require('@toast-ui/toastmark').Parser;

const convertor = MergeTextRenderer(emojiConvertor, inlineLatexConvertor);
const pluginfo = convertor(null, null);
const textRenderer: HTMLConvertor = pluginfo.toHTMLRenderers['text'] as HTMLConvertor;
function text2HTML(text: string): string {
    if (!text) return null;
    let result = textRenderer({type: 'text', literal: text} as any, null, null);

    if (!Array.isArray(result)) {
        result = [result];
    }

    return result.map(v => {
        if (v.type == 'text') 
            return `<span>${v.content}</span>`;
        else if (v.type == 'html')
            return v.content;
        else return '?????';
    }).join('');;
}


@Component({
    selector: 'app-markdown-viewer',
    template: `
    <nb-card>
        <nb-card-header>
            <div class='title'>{{ note?.title }}</div>
            <div class='info'>
                <span>CreatedAt: {{ createdAt }}</span>
                <span>UpdatedAt: {{ updatedAt }}</span>
            </div>
            <app-tag-list class='tags' [tags]='note?.tags || []'></app-tag-list>
        </nb-card-header>
        <nb-card-body class='viewer-body' (scroll)='handleScroll($event)'>
            <div [class]='"toc " + (showTOC ? "toc-open" : "")' *ngIf='(showTOCMenu || inFullscree) && headingList && headingList.length > 0'>
                <div class='toc-title'>
                    <button nbButton ghost status='primary' (click)='showTOC = !showTOC'>
                        <nb-icon icon='bars' pack='fas'></nb-icon>
                    </button>
                    <div class='percentage-bar' #percentageBar></div>
                    <span class='take-space'></span>
                    <span class='toc-text'>{{ TOCTitle }}</span>
                    <span class='take-space'></span>
                </div>
                <ul class='toc-list' *ngIf='showTOC'>
                    <app-toc *ngFor='let item of headingList' [toc]='item' (scrollTo)='showTOC=false'></app-toc>
                </ul>
            </div>
            <div class='viewer-container-outter'>
                <div class='viewer-container' #viewerContainer>
                    <app-tui-viewer [theme]='theme' [initialValue]='note?.content' [customHTMLRenderer]='CustomHTMLRenderer' #viewer></app-tui-viewer>
                </div>
            </div>
        </nb-card-body>
        <nb-card-footer>
            <button nbTooltip="edit" nbTooltipStatus="primary"
                    status='primary' size='small' ghost nbButton (click)='gotoEditor()'><nb-icon icon='edit' pack='fas'></nb-icon></button>
            <button nbTooltip="fullscreen" nbTooltipStatus="primary"
                    status='primary' size='small' ghost nbButton (click)='fullscreen()'><nb-icon icon='expand' pack='fas'></nb-icon></button>
            <button nbTooltip="screenshot" nbTooltipStatus="primary"
                    status='primary' size='small' ghost nbButton [disabled]='inScreenshoting' (click)='saveAsImage()'><nb-icon icon='image' pack='fas'></nb-icon></button>
            <button nbTooltip="history" nbTooltipStatus="primary"
                    status='primary' size='small' ghost nbButton (click)='gotoHistory()'><nb-icon icon='history' pack='fas'></nb-icon></button>
            <button nbTooltip="delete" nbTooltipStatus="danger"
                    status='danger'  size='small' ghost nbButton (click)='deleteNote()'><nb-icon icon='trash' pack='fas'></nb-icon></button>
        </nb-card-footer>
    </nb-card>
    `,
    styleUrls: ["./markdown-viewer.component.scss"],
    styles: []
})
export class MarkdownViewerComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject();
    private generation: number;

    @ViewChild('viewer', {static: true})
    private tuiviewer: TuiViewerComponent;

    @ViewChild('viewerContainer', {static: true})
    private viewerContainer: ElementRef;

    @ViewChild('percentageBar', {static: false})
    private perBar: ElementRef;

    get viewer(): Viewer {
        return this.tuiviewer.viewer;
    }

    readonly CustomHTMLRenderer = {
        heading: (node: HeadingMdNode, { entering }) => {
            const showHeadingNO = this.settings.Markdown_Show_Heading_NO;
            const { level } = node;

            if (entering) {
                const ans: any[] = [
                    {
                        type: 'openTag',
                        tagName: `h${level}`
                    },
                ];


                let info = GetHeadingNodeInfo(node);
                if (!info) {
                    ReGenerateHeadingInfo(node);
                    info = GetHeadingNodeInfo(node);
                }
                const id = `toc-${info?.levels.join('.')}`;
                ans.push({
                    type: 'html',
                    content: `<span class='heading-info' style='margin-right: 0.5em; user-select: none;' id='${id}'>
                                  ${showHeadingNO ? info?.levels?.join('.') : ''}
                              </span>`
                });
                return ans;
            } else {
                return {
                    type: 'closeTag',
                    tagName: `h${level}`
                }
            }
        },
    };

    note: Note;
    theme: string;
    get createdAt() {
        if (!this.note) {
            return "";
        }
        return new Date(this.note.createdAt).toLocaleString();
    }

    get updatedAt() {
        if (!this.note) {
            return "";
        }
        return new Date(this.note.updatedAt).toLocaleString();
    }

    constructor(private toastr: NbToastrService,
                private msgBox: MessageBoxService,
                private router: Router,
                private noteService: NoteService,
                private sharing: ObjectSharingService,
                private nbthemeService: NbThemeService,
                private host: ElementRef,
                private settings: LocalSettingService,
                private activatedRoute: ActivatedRoute)
    {
        this.theme = nbThemeIsDark(this.nbthemeService.currentTheme) ? 'dark' : 'light';
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }


    ngOnInit(): void {
        this.showTOCMenu = this.settings.Markdown_Show_TOC;

        this.activatedRoute.queryParamMap.subscribe(async (params) => {
            const key = params.get("noteref");
            const generation = params.get("generation");
            const noteid = params.get("noteid");
            if (key) {
                this.note = this.sharing.loadClear(Number(key));
            } 
            if (generation != null) {
                this.generation = Number(generation);
            } else {
                this.generation = null;
            }

            if (!this.note && noteid == null) {
                this.toastr.danger("page error", "Note");
                return;
            }

            if (this.note && this.generation == null) {
                const gen = await this.noteService.getNoteGeneratioin(this.note.id);
                if (gen != this.note.generation) {
                    // TODO using patch ?
                    this.note = null;
                }
            }

            if (!this.note) {
                await this.refresh(Number(noteid));
            } else {
                this.generateTOC();
            }
        });

        let doit = false;
        interval(5000)
            .pipe(takeUntil(this.destroy$), filter(() => this.note != null && !doit && this.generation == null))
            .subscribe(async () => {
                doit = true;
                try {
                    const gen = await this.noteService.getNoteGeneratioin(this.note.id);
                    if (gen != this.note.generation)
                        await this.refresh(this.note.id);
                    doit = false;
                } catch {}
            });
    }

    get TOCTitle() {
        return this.inFullscree ? this.note.title : 'Table of Contents';
    }

    showTOCMenu: boolean;
    showTOC: boolean = false;
    headingList: TOCItem[];
    private generateTOC() {
        if (this.note == null) {
            return;
        }

        const parser: TUIParser = new Parser();
        const node = parser.parse(this.note.content);
        const headings = GenerateHeadingInfo(node);
        if (!headings) return;
        const node2tocitems = (info: typeof headings[0]) => {
            const item: TOCItem = {} as TOCItem;
            item.levelText = info.levels.join(".");
            item.title = text2HTML(info.node?.firstChild?.literal);
            item.children = info.children && info.children.map(node2tocitems);
            return item;
        };
        this.headingList = headings.map(node2tocitems);
    }

    async refresh(noteid: number) {
        try {
            this.note = await this.noteService.getNote(Number(noteid), this.generation);
            this.generateTOC();
        } catch (e) {
            console.error(e);
            this.toastr.danger("page error", "Note");
        }
    }

    async gotoEditor() {
        if (!this.note) {
            this.toastr.danger("bad note", "Note");
        }

        this.router.navigate(["../markdown-editor"], {
            queryParams: {
                noteid: this.note.id,
            },
            relativeTo: this.activatedRoute,
        });
    }

    inFullscree: boolean = false;
    async fullscreen() {
        const widthPer = Math.max(this.settings.Markdown_Fullscreen_Width_Percent, 50);
        const container = this.viewerContainer.nativeElement as HTMLElement;
        container.style.width = `${widthPer}%`;

        const host = this.host.nativeElement as HTMLElement;
        const viewbody = host.querySelector(".viewer-body");
        viewbody.classList.add("fullscreen");
        this.inFullscree = true;

        this.handleScroll({ target: viewbody} as any);
        const popupSubject = new Subject<void>();
        interval(1000)
            .pipe(takeUntil(this.destroy$), takeUntil(popupSubject))
            .subscribe(async () => this.handleScroll({ target: viewbody} as any));

        const popstateHandler = (event: Event) => {
            event.preventDefault();
            viewbody.classList.remove("fullscreen");
            window.removeEventListener("popstate", popstateHandler);
            container.style.width = "100%";
            popupSubject.next();
            popupSubject.complete();
        };
        window.addEventListener('popstate', popstateHandler);
        history.pushState({page: this.note.title}, this.note.title, `${location.href}?notefullscree`);
    }

    ScrollPercent: number = 0;
    handleScroll(event: Event) {
        if (!this.inFullscree) return;

        const target = event.target as HTMLElement;
        if (target.clientHeight >= target.scrollHeight) {
            this.ScrollPercent = 100;
        } else {
            this.ScrollPercent = target.scrollTop / (target.scrollHeight - target.clientHeight);
        }

        const perElem = this.perBar.nativeElement as HTMLElement;
        perElem.style.width = `${this.ScrollPercent * 100}%`;
    }

    async gotoHistory() {
        if (!this.note) {
            this.toastr.danger("bad note", "Note");
        }

        this.router.navigate(["../markdown-note-history"], {
            queryParams: {
                noteid: this.note.id,
            },
            relativeTo: this.activatedRoute,
        });
    }

    async deleteNote() {
        if (await this.msgBox.confirmMSG("Are you sure to delete this note?", "Note")) {
            try {
                await this.noteService.deleteNote(this.note.id);
                this.toastr.success("note deleted", "Note");
                this.router.navigate(["../timeline"], {
                    relativeTo: this.activatedRoute
                });
            } catch {
                this.toastr.danger("note delete failed", "Note");
            }
        }
    }

    inScreenshoting = false;
    async saveAsImage() {
        this.inScreenshoting = true;
        try {
            const host = this.host.nativeElement as HTMLElement;
            const viewer = host.querySelector('app-tui-viewer') as HTMLElement;
            const canvas = await html2canvas(viewer);
            const imgData = canvas.toDataURL('image/png');
            downloadURI(imgData, `${this.note.title}.png`);
        } finally {
            this.inScreenshoting = false;
        }
    }
}

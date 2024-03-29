import { AfterViewInit, Component, ElementRef, EventEmitter, Input, 
         OnInit, OnChanges, OnDestroy, Output, SimpleChanges,
         ViewEncapsulation } from '@angular/core';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Viewer } from '@toast-ui/react-editor';
import { Viewer as TUIViewer, EditorPlugin, EditorType, Editor as TUIEditor, EventMap,
         LinkAttributes, ExtendedAutolinks, CustomHTMLRenderer, Sanitizer } from '@toast-ui/editor/types/editor';
import latex, { inlineLatexConvertor } from '../LatexPlugin';
import emoji, { emojiConvertor } from '../EmojiPlugin';
import { MergeTextRenderer } from '../MergeTextRendererPlugin';
import uml from '@toast-ui/editor-plugin-uml';
import chart from '@toast-ui/editor-plugin-chart';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import tableMergedCell from '@toast-ui/editor-plugin-table-merged-cell';
declare const require: any;
const colorSyntaxHighlight = require('@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight-all');


@Component({
    selector: 'app-tui-viewer',
    template: ``,
    styleUrls: ['./tui-viewer.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class TuiViewerComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
    @Input() public initialValue: string;
    @Input() public plugins: EditorPlugin[];
    @Input() public key: React.Key;
    @Input() public theme: string;
    @Input() public events: EventMap;
    @Input() public frontMatter: boolean;
    @Input() public linkAttributes: LinkAttributes;
    @Input() public usageStatistics: boolean;
    @Input() public extendedAutolinks: ExtendedAutolinks;
    @Input() public customHTMLRenderer: CustomHTMLRenderer;
    @Input() public customHTMLSanitizer: Sanitizer;
    @Input() public referenceDefinition: boolean;

    @Output() public readonly blur = new EventEmitter<EditorType>();
    @Output() public readonly load = new EventEmitter<TUIEditor>();
    @Output() public readonly focus = new EventEmitter<EditorType>();
    @Output() public readonly keyup = new EventEmitter<[EditorType, KeyboardEvent]>();
    @Output() public readonly change = new EventEmitter<EditorType>();
    @Output() public readonly keydown = new EventEmitter<[EditorType, KeyboardEvent]>();
    @Output() public readonly caretChange = new EventEmitter<string>();
    @Output() public readonly beforePreviewRender = new EventEmitter<string>();
    @Output() public readonly beforeConvertWysiwygToMarkdown = new EventEmitter<string>();

    viewer: TUIViewer;
    private root: Root;
    constructor(private host: ElementRef) {}

    private onRefChange(obj: any) {
        this.viewer = obj?.viewerInst;

        if (this.viewer) {
            this.viewer.setMarkdown(this.initialValue);
        }
    }

    ngOnInit(): void {
        this.root = createRoot(this.host.nativeElement as HTMLElement);
        this.plugins = this.plugins || [];
        // TODO colorSyntax error
        for (const plug of [
            uml, chart, colorSyntaxHighlight, tableMergedCell,
            latex, emoji, MergeTextRenderer(emojiConvertor, inlineLatexConvertor) ])
        {
            this.plugins.push(plug);
        }
    }

    ngOnChanges(_changes: SimpleChanges): void {
        if (this.root)
            this.render();
    }

    ngAfterViewInit() {
        this.render();
    }

    ngOnDestroy() {
        this.root.unmount();
    }

    private render() {
        this.root.render(
            <React.StrictMode>
                <Viewer
                initialValue={ this.initialValue }
                plugins={this.plugins}
                key={this.key}
                theme={this.theme || 'light'}
                events={this.events}
                frontMatter={this.frontMatter}
                linkAttributes={this.linkAttributes}
                usageStatistics={this.usageStatistics}
                extendedAutolinks={this.extendedAutolinks}
                customHTMLRenderer={this.customHTMLRenderer}
                customHTMLSanitizer={this.customHTMLSanitizer}
                referenceDefinition={this.referenceDefinition}

                onBlur={ e => this.blur.emit(e) }
                onLoad={ e => this.load.emit(e) }
                onFocus={ e => this.focus.emit(e) }
                onKeyup={ (e, k) => this.keyup.emit([e, k]) }
                onChange={ e => this.change.emit(e) }
                onKeydown={ (e, k) => this.keydown.emit([e, k]) }
                onCaretChange={ e => this.caretChange.emit(e) }
                onBeforePreviewRender={ text => { this.beforePreviewRender.emit(text); return text; } }
                onBeforeConvertWysiwygToMarkdown={ text => { this.beforeConvertWysiwygToMarkdown.emit(text); return text; } }
                ref={this.onRefChange.bind(this)}
                />
            </React.StrictMode>);
    }
}

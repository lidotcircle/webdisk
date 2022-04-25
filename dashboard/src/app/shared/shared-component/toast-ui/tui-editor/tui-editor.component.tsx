import { AfterViewInit, Component, ElementRef, EventEmitter, Input, 
         OnInit, OnChanges, OnDestroy, Output, SimpleChanges,
         ViewEncapsulation } from '@angular/core';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Editor } from '@toast-ui/react-editor';
import { EditorPlugin, EditorType, PreviewStyle, Editor as TUIEditor, HookMap, EventMap,
         WidgetRule, LinkAttributes, ExtendedAutolinks, CustomHTMLRenderer, Sanitizer } from '@toast-ui/editor/types/editor';
import { ToolbarItemOptions } from '@toast-ui/editor/types/ui';
import { ToMdConvertorMap } from '@toast-ui/editor/types/convertor';
import latex from '../LatexPlugin';
import uml from '@toast-ui/editor-plugin-uml';
import chart from '@toast-ui/editor-plugin-chart';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import tableMergedCell from '@toast-ui/editor-plugin-table-merged-cell';
declare const require: any;
const colorSyntaxHighlight = require('@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight-all');

@Component({
    selector: 'app-tui-editor',
    template: ``,
    styleUrls: ['./tui-editor.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class TuiEditorComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
    @Input() public initialValue: string;
    @Input() public initialEditType: EditorType;
    @Input() public previewStyle: PreviewStyle;
    @Input() public height: string;
    @Input() public plugins: EditorPlugin[];
    @Input() public key: React.Key;
    @Input() public hooks: HookMap;
    @Input() public theme: string;
    @Input() public events: EventMap;
    @Input() public viewer: boolean;
    @Input() public language: string;
    @Input() public autofocus: boolean;
    @Input() public minHeight: string;
    @Input() public frontMatter: boolean;
    @Input() public placeholder: string;
    @Input() public widgetRules: WidgetRule[];
    @Input() public toolbarItems: (string | ToolbarItemOptions)[][];
    @Input() public hideModeSwitch: boolean;
    @Input() public linkAttributes: LinkAttributes;
    @Input() public usageStatistics: boolean;
    @Input() public previewHighlight: boolean;
    @Input() public extendedAutolinks: ExtendedAutolinks;
    @Input() public customHTMLRenderer: CustomHTMLRenderer;
    @Input() public useCommandShortcut: boolean;
    @Input() public customHTMLSanitizer: Sanitizer;
    @Input() public referenceDefinition: boolean;
    @Input() public customMarkdownRenderer: ToMdConvertorMap;

    @Output() public readonly blur = new EventEmitter<EditorType>();
    @Output() public readonly load = new EventEmitter<TUIEditor>();
    @Output() public readonly focus = new EventEmitter<EditorType>();
    @Output() public readonly keyup = new EventEmitter<[EditorType, KeyboardEvent]>();
    @Output() public readonly change = new EventEmitter<EditorType>();
    @Output() public readonly keydown = new EventEmitter<[EditorType, KeyboardEvent]>();
    @Output() public readonly caretChange = new EventEmitter<string>();
    @Output() public readonly beforePreviewRender = new EventEmitter<string>();
    @Output() public readonly beforeConvertWysiwygToMarkdown = new EventEmitter<string>();

    editor: TUIEditor;
    private root: Root;
    constructor(private host: ElementRef) {
    }

    ngOnInit(): void {
        this.root = createRoot(this.host.nativeElement as HTMLElement);
        this.plugins = this.plugins || [];
        for (const plug of [ uml, chart, colorSyntax, colorSyntaxHighlight, tableMergedCell, latex ]) {
            this.plugins.push(plug);
        }
    }

    private refChange(obj: any) {
        this.editor = obj?.editorInst;

        // TODO props doesn't work properly
        if (this.editor) {
            this.editor.setMarkdown(this.initialValue);
        }
    }

    ngOnChanges(_changes: SimpleChanges): void {
        if (this.root)
            this.render();
        this.initialValue = this.initialValue || '';
    }

    ngAfterViewInit() {
        this.render();
    }

    ngOnDestroy() {
        this.root.unmount();
    }

    private render() {
        const opts = {};
        if (this.toolbarItems) opts["toolbarItems"] = this.toolbarItems;
        if (this.widgetRules) opts["widgetRules"] = this.widgetRules;

        const initval = (this.initialValue != null && this.initialValue != '') ? this.initialValue : '\n';
        this.root.render(
            <React.StrictMode>
                <Editor
                previewStyle={this.previewStyle || 'vertical'}
                height={this.height || 'auto'}
                initialEditType={this.initialEditType || 'markdown'}
                initialValue={initval}

                {... opts}

                plugins={this.plugins}
                key={this.key}
                hooks={this.hooks}
                theme={this.theme}
                events={this.events}
                viewer={this.viewer}
                language={this.language}
                autofocus={this.autofocus}
                minHeight={this.minHeight}
                frontMatter={this.frontMatter}
                placeholder={this.placeholder}
                hideModeSwitch={this.hideModeSwitch}
                linkAttributes={this.linkAttributes}
                usageStatistics={this.usageStatistics}
                previewHighlight={this.previewHighlight}
                extendedAutolinks={this.extendedAutolinks}
                customHTMLRenderer={this.customHTMLRenderer}
                useCommandShortcut={this.useCommandShortcut}
                customHTMLSanitizer={this.customHTMLSanitizer}
                referenceDefinition={this.referenceDefinition}
                customMarkdownRenderer={this.customMarkdownRenderer}

                onBlur={ e => this.blur.emit(e) }
                onLoad={ e => this.load.emit(e) }
                onFocus={ e => this.focus.emit(e) }
                onKeyup={ (e, k) => this.keyup.emit([e, k]) }
                onChange={ e => this.change.emit(e) }
                onKeydown={ (e, k) => this.keydown.emit([e, k]) }
                onCaretChange={ e => this.caretChange.emit(e) }
                onBeforePreviewRender={ text => { this.beforePreviewRender.emit(text); return text; } }
                onBeforeConvertWysiwygToMarkdown={ text => { this.beforeConvertWysiwygToMarkdown.emit(text); return text; } }
                ref={(e) => this.refChange(e)}
                />
            </React.StrictMode>);
    }
}

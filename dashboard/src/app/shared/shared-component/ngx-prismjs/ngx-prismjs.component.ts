import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';
import { highlight, languages } from 'prismjs';

declare var require: any;
[
    'json', 'json5', 'c', 'cpp', 'java',
].map(lang => require('prismjs/components/prism-' + lang));


function createCodeHTMLFromString(text: string) {
    const div = document.createElement('code');
    div.innerHTML = text;
    return div;
}

@Component({
    selector: 'ngx-prismjs',
    template: `
    <pre class='code-viewer-{{language}} language-{{language}}' #codeviewer></pre>
    `,
    styles: [`
    pre {
        background: transparent;
        padding: 0em;
        height: 100%;
        width: 100%;
        margin: 0em;
    }
    code {
        height: 100%;
        width: 100%;
    }`],
})
export class PrismJSComponent implements OnInit {
    constructor() {}

    @Input()
    code: string;
    @Input()
    language: string;
    @Input()
    inlined: boolean;
    @ViewChild('codeviewer', {static: true}) codeviewer: ElementRef;

    ngOnInit() {
        if (this.inlined === undefined)
            this.inlined = true;

        this.update(this.code, this.language);
    }

    update(code: string, language: string) {
        code = this.code || '';
        language = languages[language] ? language : 'plain';

        const html = highlight(code, languages[language], language);
        const element = createCodeHTMLFromString(html);
        element.classList.add('language-' + language);
        const elem = this.codeviewer.nativeElement as HTMLElement;
        while (elem.lastChild)
            elem.removeChild(elem.lastChild);
        elem.appendChild(element);
    }
}

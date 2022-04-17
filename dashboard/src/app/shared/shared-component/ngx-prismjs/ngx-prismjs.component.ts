import { Component, OnInit, Input, ElementRef, ViewChild, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { highlightElement, plugins } from 'prismjs';

// preload grammars
declare var require: any;
[
    'json', 'json5', 'c', 'cpp', 'java', 'python',
].map(lang => require('prismjs/components/prism-' + lang + '.min'));

// load plugins
[
    'line-numbers', 'autoloader',
].map(plug => require('prismjs/plugins/' + plug + '/prism-' + plug + '.min'));
// plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/components/';
plugins.autoloader.languages_path = '/assets/prismjs/components/';

function createCodeHTMLFromString(text: string) {
    const div = document.createElement('code');
    div.innerHTML = text;
    return div;
}

@Component({
    selector: 'ngx-prismjs',
    template: `
    <pre  class='code-viewer' style='margin: 0em;' #codeviewer></pre>
    <code class='ngx-prismjs-ttxx' #cvinline></code>
    `,
    styleUrls: ['./ngx-prismjs.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class PrismJSComponent implements OnInit, OnChanges {
    constructor(private elementRef: ElementRef) { }

    @Input()
    theme: string;
    @Input()
    inline: boolean;
    @Input()
    lineno: boolean;
    @Input()
    code: string;
    @Input()
    language: string;

    @ViewChild('codeviewer', {static: true})
    private codeviewer: ElementRef;

    @ViewChild('cvinline', {static: true})
    private cvinline: ElementRef;

    ngOnInit() {
        if (this.theme == null) {
            const host = this.elementRef.nativeElement as HTMLElement;
            host.classList.add('theme-default');
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.code || changes.language || 
            changes.lineno || changes.inline)
        {
            this.update(this.code, this.language);
        }

        if (changes.theme) {
            const host = this.elementRef.nativeElement as HTMLElement;
            this.clear_class_startsWith('theme-', host);
            host.classList.add('theme-' + this.theme);
        }
    }

    private clear_class_startsWith(sw: string, elem: HTMLElement) {
        const rmlist = [];
        elem.classList.forEach(v => {
            if (v.startsWith(sw))
                rmlist.push(v);
        });
        rmlist.map(l => elem.classList.remove(l));
    }

    update(code: string, language: string) {
        code = this.code || '';
        language = language.toLowerCase();

        if (this.inline) {
            const block_elem = this.codeviewer.nativeElement as HTMLElement;
            block_elem.classList.add("ngx-prismjs-ttxx");

            const element = this.cvinline.nativeElement as HTMLElement;
            element.classList.remove("ngx-prismjs-ttxx");
            this.clear_class_startsWith('language-', element);
            element.classList.add('language-' + language);
            element.textContent = code;
            highlightElement(element);
        } else {
            const inline_elem = this.cvinline.nativeElement as HTMLElement;
            inline_elem.classList.add("ngx-prismjs-ttxx");

            const elem = this.codeviewer.nativeElement as HTMLElement;
            elem.classList.remove("ngx-prismjs-ttxx");
            this.clear_class_startsWith('language-', elem);
            elem.classList.add('language-' + language);
            if (this.lineno)
                elem.classList.add('line-numbers');
            else
                elem.classList.remove('line-numbers');

            const element = createCodeHTMLFromString('<code></code>');
            element.classList.add('language-' + language);

            while (elem.lastChild)
                elem.removeChild(elem.lastChild);
            elem.appendChild(element);

            element.textContent = code;
            highlightElement(element);
        }
    }
}

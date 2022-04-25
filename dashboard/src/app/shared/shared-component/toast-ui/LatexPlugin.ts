import { PluginContext } from '@toast-ui/editor/types/editor';
import { PluginInfo } from '@toast-ui/editor/types';
import { HTMLConvertor, MdNode, Context, HTMLConvertorMap } from '@toast-ui/editor/types/toastmark';
import katex from 'katex';
import 'katex/contrib/mhchem';


// !! DON'T forget include katex css in project root style
function parseInlineDollarDollar(text: string): { type: 'text' | 'latex', content: string }[] {
    const ans = [];
    // 0: normal, 1: escaped, 2: math, 3: math escaped
    // 0 ($)-> 2, 0 (\)-> 1, 0 ([^$\])-> 0
    // 1 (*)-> 0
    // 2 (\)-> 3, 2 ($)-> 0, 2 ([^$\])-> 2
    // 3 (*)-> 2
    let state = 0;

    ans.push( { type: 'text', content: ''} );
    const append = (c: string) => ans[ans.length - 1].content += c;
    for (const c of text) {
        switch (state) {
            case 0: {
                if (c == '$') {
                    state = 2;
                    ans.push( { type: 'latex', content: ''} );
                } else if (c == '\\') {
                    state = 1;
                } else {
                    append(c);
                }
            } break;
            case 1: 
                append('\\');
                append(c);
                state = 0;
                break;
            case 2: {
                if (c == '$') {
                    state = 0;
                    ans.push( { type: 'text', content: ''} );
                } else if (c == '\\') {
                    state = 3;
                } else {
                    append(c);
                }
            } break;
            case 3:
                append('\\');
                append(c);
                state = 2;
                break;
            default: throw new Error('impossible state');
        }
    }

    if (ans[0].content == '') ans.splice(0, 1);
    if (ans.length > 0 && ans[ans.length - 1].content == '') ans.splice(ans.length - 1, 1);

    return ans;
}

export default function latex(_context: PluginContext, _options: any): PluginInfo {
    const latexConvertor: HTMLConvertor = (node: MdNode, _ccontext: Context, _convertors?: HTMLConvertorMap) => {
        const html = katex.renderToString(node.literal);

        return [
            { type: 'openTag', tagName: 'div', outerNewLine: true },
            { type: 'html', content: `
                <div style="width:100%;font-size:large;display:flex;flex-direction:row;">
                    <span style="flex-grow:1;"></span>
                    ${html}
                    <span style="flex-grow: 1;"></span>
                </div>` },
            { type: 'closeTag', tagName: 'div', outerNewLine: true }
        ];
    };

    const inlineLatexConvertor: HTMLConvertor = (node: MdNode, _ccontext: Context, _convertors?: HTMLConvertorMap) => {
        const sl = parseInlineDollarDollar(node.literal);
        const ans: any[] = sl.map( v => {
            if (v.type == 'text') {
                return v;
            } else {
                try {
                    const html = katex.renderToString(v.content);
                    return { type: 'html', content: html };
                } catch {
                    return { type: 'html', content: `<span style="color: red;">${v.content}</span>`};
                }
            }
        });

        return ans;
    };

    const toHTMLRenderers = {
        latex: latexConvertor,
        text: inlineLatexConvertor,
    }
    return { toHTMLRenderers };
}

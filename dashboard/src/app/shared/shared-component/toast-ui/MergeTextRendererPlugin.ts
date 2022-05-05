import { PluginContext } from '@toast-ui/editor/types/editor';
import { PluginInfo } from '@toast-ui/editor/types';
import { HTMLConvertor, MdNode, Context, HTMLConvertorMap, HTMLToken } from '@toast-ui/editor/types/toastmark';


export function MergeTextRenderer(...textConvertors: HTMLConvertor[]) {
    const mergedConvertor: HTMLConvertor = (node: MdNode, ccontext: Context, convertors?: HTMLConvertorMap) => {
        let rootTokens: HTMLToken[] = [ { type: 'text', content: node.literal } ];

        for (const convertor of textConvertors) {
            const tk = [];
            for (const token of rootTokens) {
                if (token.type != 'text') {
                    tk.push(token);
                    continue;
                }

                const rs = convertor({ type: 'text', literal: token.content } as MdNode, ccontext, convertors);
                if (Array.isArray(rs)) {
                    rs.forEach(v => tk.push(v));
                } else if (rs) {
                    tk.push(rs);
                }
            }

            rootTokens = tk;
        }

        return rootTokens;
    };

    return (_context: PluginContext, _options: any): PluginInfo => {
        const toHTMLRenderers = {
            text: mergedConvertor,
        }
        return { toHTMLRenderers };
    }
}

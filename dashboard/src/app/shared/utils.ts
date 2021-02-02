
export * from '../../../../lib/common/utils';
export * from './FileSystemEntry';
export * from './life';

export function nextTick(func) {
    setTimeout(func, 0);
}

export module validation {
  const __validName  = /^([A-Za-z]|\p{Unified_Ideograph})([A-Za-z0-9_]|\p{Unified_Ideograph}){2,}$/u;
  export function validName(name: string): boolean {
    return __validName.test(name);
  }

  export const MatchAll: string = '^.*$';
  export const NotMatch: string = '.^';
}

export const rootViewContainerRefSymbol = Symbol('bodyContainer');

export function hasTouchScreen(): boolean {
    let hasTouchScreen = false;
    if ("maxTouchPoints" in navigator) {
        hasTouchScreen = navigator.maxTouchPoints > 0;
    } else if ("msMaxTouchPoints" in navigator) {
        hasTouchScreen = navigator['msMaxTouchPoints'] > 0;
    } else {
        let mQ = window.matchMedia && matchMedia("(pointer:coarse)");
        if (mQ && mQ.media === "(pointer:coarse)") {
            hasTouchScreen = !!mQ.matches;
        } else if ('orientation' in window) {
            hasTouchScreen = true; // deprecated, but good fallback
        }
    }
    return hasTouchScreen;
}

export function downloadURI(uri: string, name: string = null)
{
    var link = document.createElement("a");
    if (!!name) {
        link.download = name;
    }
    link.href = uri;
    link.click();
}

export function createNodeFromHtmlString(htmlText: string): HTMLElement
{
    let div = document.createElement("div");
    div.innerHTML = htmlText.trim();
    return div.firstChild as HTMLElement;
}

function fallbackCopyTextToClipboard(text: string): boolean //{
{
    var textArea = document.createElement("textarea");
    textArea.value = text;

    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        return true;
    } catch {
        return false;
    } finally {
        document.body.removeChild(textArea);
    }
} //}
export async function copyTextToClipboard(text: string) //{
{
    if (!navigator.clipboard) {
        return fallbackCopyTextToClipboard(text);
    }

    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
} //}

export module Convert {
    export function bv2str(s: number) {
        const MAP = {};
        MAP['Bytes'] = 'KB';
        MAP['KB'] = 'MB';

        let unit = 'Bytes';
        while(s > 1024 && MAP[unit]) {
            s /= 1024;
            unit = MAP[unit];
        }
        return s.toFixed(1) + ' ' + unit;
    }

    export function tv2str(t: number) {
        if(t < 60 * 2) return Math.floor(t) + 'S';
        else if (t < 60 * 60) return Math.floor(t / 60) + 'Mins';
        else if (t < 60 * 60 * 24) return Math.floor(t / (60 * 60)) + 'Hours';
        else return Math.floor(t / (24 * 60 * 60)) + 'Days';
    }

    export class TrafficSpeedGenerate //{
    {
        private ntpairs: [number, number][] = [];
        private elapseMs: number = 3000;

        constructor(elapse_ms?: number) {
            this.elapseMs = this.elapseMs || elapse_ms;
        }

        get speed(): string {
            return null;
            const now = Date.now();
            let i=0;
            for(;i<this.ntpairs.length;i++) {
                const pair = this.ntpairs[i];
                if(now - pair[0] <= this.elapseMs) {
                    break;
                }
            }
            if(i > 0) {
                this.ntpairs.splice(0, i);
                if(now - this.ntpairs[0][0] > this.elapseMs) {
                    this.ntpairs = [];
                }
            }
            let n=0;
            for(const pair of this.ntpairs) {
                n += pair[1];
            }
            return bv2str(n / (this.elapseMs / 1000)) + '/S';
        }

        push(n_bytes: number): void {
            this.ntpairs.push([Date.now(), n_bytes]);
        }
    } //}
}


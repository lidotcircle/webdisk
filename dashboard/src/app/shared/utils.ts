
export * from '../../../../lib/common/utils';
export * from './FileSystemEntry';

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


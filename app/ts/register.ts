/**
 * register function such as upload to an element
 */

export type RegisterFunction = (elem: HTMLElement) => void;

export function dummyRegister(elem: HTMLElement): void {}

// TODO
/**
 * provide drag and drop events callback
 * @param {HTMLElement} elem element that need this function
 */
export function upload(elem: HTMLElement): void {
    elem.addEventListener("dragleave", (ee: CustomEvent) => {
        ee.stopPropagation();
        ee.preventDefault();
        console.log("being draged", ee);
    });
    elem.addEventListener("dragover", (ee: CustomEvent) => {
        ee.stopPropagation();
        ee.preventDefault();
    });
    elem.addEventListener("drop", (ee: CustomEvent) => {
        ee.stopPropagation();
        ee.preventDefault();
        console.log("something drop", ee);
    });
}

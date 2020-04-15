/**
 * register function such as upload to an element
 */

import { debug } from './util';

import * as gvar from './global_vars';
import * as constants from './constants';
import * as details from './details';
import * as util from './util';
import * as types from './types';

/** register some function to a HTMLElement */
export type RegisterFunction = (elem: HTMLElement, dt: details.Detail, dti: details.DetailItem) => void;
export function dummyRegister(elem: HTMLElement, dt: details.Detail, dti: details.DetailItem): void {}
export function form_multi_functions(funcs: RegisterFunction[]) //{
{
    return (elem: HTMLElement, dt: details.Detail, dti: details.DetailItem) => {
        for(let f of funcs)
            f(elem, dt, dti);
    };
} //}


// TODO
/**
 * provide drag and drop events callback
 * @param {HTMLElement} elem element that need this function
 */
export function upload(elem: HTMLElement, dt: details.Detail, dti: details.DetailItem): void //{
{
    /*
    elem.addEventListener("dragleave", (ee: CustomEvent) => {
//        ee.stopPropagation();
//        ee.preventDefault();
//        console.log("being draged leave");
    });
    elem.addEventListener("dragstart", (ee: CustomEvent) => {
//        console.log("being draged start");
    });
    elem.addEventListener("dragend", (ee: CustomEvent) => {
//        console.log("being draged end");
    });
    */
    elem.addEventListener("dragover", (ee: CustomEvent) => {
        ee.stopPropagation();
        ee.preventDefault();
//        console.log("being draged over");
    });
    elem.addEventListener("drop", (ee: DragEvent) => {
        ee.stopPropagation();
        ee.preventDefault();
        let di = elem[constants.KDetailItem] as details.DetailItem;
        if(di.Stat.type != types.FileType.dir) {
            debug("drop should only support directory");
            return;
        }
        for(let i=0; i<ee.dataTransfer.items.length; i++) {
            let x = ee.dataTransfer.items[i].webkitGetAsEntry();
            if (x.isFile || x.isDirectory) { // FileSystemEntry
                gvar.Upload.upload.newTask(x, di.Stat.filename);
            }
        }
    });
} //}

/**
 * @param {HTMLElement} elem delegate element
 * @param {string} targetClass class that the target should contain it
 * @param {string} selectClass Toggle this class, when click event fires
 */
function multi_selecte(elem: HTMLElement, targetClass: string, selectClass: string): void //{
{
    elem.addEventListener("click", (e) => {
        let src: HTMLElement = e.target as HTMLElement;
        if(src == null || src.tagName == null) {
            debug("false target of event");
            return;
        }
        while (src != null && src.classList && !src.classList.contains(targetClass)) {
            if (src.tagName == "HTML") {
                let items = document.querySelectorAll(`.${selectClass}`);
                for(let i=0; i<items.length; i++)
                    items.item(i).classList.remove(selectClass);
                return;
            }
            src = src.parentNode as HTMLElement;
        }
        if (src == null || !src.classList)
            return;
        if (e.ctrlKey)
            return src.classList.toggle(selectClass);
        let dd = src.previousElementSibling;
        while(dd) {
            dd.classList.remove(selectClass);
            dd = dd.previousElementSibling;
        }
        dd = src.nextElementSibling;
        while(dd) {
            dd.classList.remove(selectClass);
            dd = dd.nextElementSibling;
        }
        src.classList.add(selectClass);
    });
} //}

/** double click a folder element to change current directory */
export function dblclick_chdir(elem: HTMLElement, dt: details.Detail, dti: details.DetailItem) //{
{
    if(dti.Stat.type != types.FileType.dir) return;
    elem.addEventListener("dblclick", () => {
        dt.chdir(dti.Stat.filename);
    });
} //}

/** double click to download a file */
const dblclick_delay = 500;
export function dblclick_download(elem: HTMLElement, dt: details.Detail, dti: details.DetailItem) //{
{
    if(elem.tagName != "A") return;
    if(dti.Stat.type == types.FileType.dir) return;
    let clicked = false;
    elem.addEventListener("click", (e) => {
        if (clicked) return;
        clicked = true;
        setTimeout(() => {
            clicked = false;
        }, dblclick_delay);
        e.preventDefault();
    });
    let cookie_list = util.parseCookie(document.cookie);
    let sid = cookie_list.get("SID");
    let url = "http://" + document.location.host + constants.DISK_PREFIX + dti.Stat.filename + "?sid=" + sid;
    elem.setAttribute("href", url);
} //}

export function SetupReg() {
    multi_selecte(constants.detail_page, constants.CSSClass.file_item, constants.CSSClass.selected);
}


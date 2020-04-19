import * as constants from './constants';
import * as gvar from './global_vars';
import * as details from './details';
import { debug } from './util';
import * as controller from './controller';
import * as util from './util';

var copy_store: details.DetailItem[] = [];
var cut_store: details.DetailItem[] = []

let html = document.querySelector("html");

export function SetupTools() {
    /** back parent directory */ //{
    constants.tool.back.addEventListener("click", () => {
        gvar.Detail.Details.backDir().then(() => {
            debug("click back icon success");
        }, (err) => {
            debug("click back icon fail", err);
        });
    }); //}

    /** refresh */ //{
    constants.tool.refresh.addEventListener("click", () => {
        gvar.Detail.Details.chdir(gvar.Detail.Details.cwd).then(() => {
        }, (err) => {
            debug("refresh error: ", err);
        });
    }); //}

    /** rename */ //{
    constants.tool.rename.addEventListener("click", () => {
        let vv = document.querySelectorAll(`.${constants.CSSClass.selected}`);
        if (vv.length != 1) {
            // TODO inform only support rename one file
            return;
        }
        let ff = vv[0][constants.KFilenameControl] as controller.FilenameBar;
        if (ff == null) {
            debug("something wrong");
            return;
        }
        ff.editName();
    });
    gvar.Detail.Details.on("change", (n, o) => {
        gvar.File.manager.rename(o, n, (err) => {
            if(err) {
                debug(err);
                // TODO inform error
            }
            constants.tool.refresh.dispatchEvent(new CustomEvent("click"));
        });
    }); //}

    /** f2 */ //{
    const f2_keycode = 113;
    html.addEventListener("keydown", (ev: KeyboardEvent) => {
        if(ev.keyCode == f2_keycode)
            constants.tool.rename.click();
    }); //}

    /** delete selected files */ //{
    constants.tool.del.addEventListener("click", () => {
        let vv = document.querySelectorAll(`.${constants.CSSClass.selected}`);
        let pp: Promise<any>[] = [];
        for(let i=0; i<vv.length; i++) {
            let x = vv[i][constants.KDetailItem] as details.DetailItem;
            if (x == null) continue;
            pp.push(gvar.File.manager.removeP(x.Stat.filename));
        }
        Promise.all(pp).then(() => {
            constants.tool.refresh.dispatchEvent(new CustomEvent("click"));
            // TODO inform success
        }, (err) => {
            debug(err);
            // TODO inform failure
        });
    }); //}

    /** address bar */ //{
    let address_bar = new controller.AddressBar(constants.CSSClass.hide_elem);
    constants.tool.address.appendChild(address_bar.Elem);
    address_bar.setAddr("/");
    address_bar.on("click", p => {
        console.log(p);
        let mm = gvar.Detail.Details.cwd;
        gvar.Detail.Details.chdir(p).then(null, (err) => {
            // TODO inform failure
            debug(err);
        });
    });
    address_bar.on("change", (n, o) => {
        gvar.Detail.Details.chdir(n).then(null, (err) => {
            // TODO inform failure
            debug(err);
        });
    });
    gvar.Detail.Details.on("chdir", dir => address_bar.setAddr(dir));
    //}

    /** new file */ //{
    constants.tool.new_file.addEventListener("click", () => {
        gvar.File.manager.newfile(gvar.Detail.Details.cwd, (err, msg) => {
            let mm = msg["file"];
            if(err || mm == null) {
                // inform failure TODO
                return;
            }
            gvar.Detail.Details.chdir(gvar.Detail.Details.cwd).then(() => {
                let xx = gvar.Detail.Details.QueryItem(util.basename(mm));
                let yy: controller.FilenameBar = xx.toHtmlElement()[constants.KFilenameControl];
                debug(yy);
                yy.editName();
            }, (err) => {
                debug(err);
                // infor failure TODO
            });
        });
    }); //}

    /** new folder */ //{
    constants.tool.new_folder.addEventListener("click", () => {
        gvar.File.manager.newfolder(gvar.Detail.Details.cwd, (err, msg) => {
            let mm = msg["dir"];
            if(err || mm == null) {
                // inform failure TODO
                return;
            }
            gvar.Detail.Details.chdir(gvar.Detail.Details.cwd).then(() => {
                let xx = gvar.Detail.Details.QueryItem(util.basename(mm));
                let yy: controller.FilenameBar = xx.toHtmlElement()[constants.KFilenameControl];
                debug(yy);
                yy.editName();
            }, (err) => {
                debug(err);
                // infor failure TODO
            });
        });
    }); //}

    /* settings */
    constants.tool.settings.onclick = () => {
        let x = new controller.ConfirmMenu("are you sure?", ["yes", "no"]);
        x.GetInputP().then((msg) => {
            debug(msg);
            window.alert(msg);
        });
    };

    constants.tool.find.onclick = () => {
        let x = new controller.TransferProgressBar("hello", () => {window.alert("cancel");});
        x.start(200);
        x.progress(100, 200);
    };

    /** copy */ //{
    constants.tool.copy.onclick = () => {
        let selected = document.querySelectorAll(".x-selected");
        if (selected.length > 0) {
            let stale_copy = document.querySelectorAll(".x-copy");
            let stale_cut = document.querySelectorAll(".x-cut");
            stale_copy.forEach((v, k, p) => v.classList.remove("x-copy"));
            stale_cut. forEach((v, k, p) => v.classList.remove("x-cut"));
        }
        selected.forEach((v, k, p) => {
            v.classList.remove("x-selected");
            v.classList.add("x-copy");
            if (v[constants.KDetailItem]) copy_store.push(v[constants.KDetailItem]);
        });
        if (selected.length > 0) {
            constants.tool.paste.classList.remove("tool-disable");
        }
    } //}

    /** cut */ //{
    constants.tool.cut.onclick = () => {
        let selected = document.querySelectorAll(".x-selected");
        if (selected.length > 0) {
            let stale_copy = document.querySelectorAll(".x-copy");
            let stale_cut = document.querySelectorAll(".x-cut");
            stale_copy.forEach((v, k, p) => v.classList.remove("x-copy"));
            stale_cut. forEach((v, k, p) => v.classList.remove("x-cut"));
        }
        selected.forEach((v, k, p) => {
            v.classList.remove("x-selected");
            v.classList.add("x-cut");
            if (v[constants.KDetailItem]) cut_store.push(v[constants.KDetailItem]);
        });
        if (selected.length > 0) {
            constants.tool.paste.classList.remove("tool-disable");
        }
    } //}

    /** paste */ //{
    async function paste_action() //{
    {
        let cwd = gvar.Detail.Details.cwd;
        let stale_copy = document.querySelectorAll(".x-copy");
        let stale_cut = document.querySelectorAll(".x-cut");
        stale_copy.forEach((v, k, p) => v.classList.remove("x-copy"));
        stale_cut. forEach((v, k, p) => v.classList.remove("x-cut"));
        let cc = copy_store;
        let cx = cut_store;
        copy_store = [];
        cut_store = [];
        if(stale_copy.length != 0 || stale_cut.length != 0) return;
        for (let pdi of cc) {
            let src = pdi.Stat.filename;
            let dst = util.pathJoin(cwd, util.basename(src));
            await gvar.File.manager.copyrP(src, dst);
            constants.tool.refresh.dispatchEvent(new CustomEvent("click"));
        }
        for (let pdi of cx) {
            let src = pdi.Stat.filename;
            let dst = util.pathJoin(cwd, util.basename(src));
            await gvar.File.manager.renameP(src, dst);
            constants.tool.refresh.dispatchEvent(new CustomEvent("click"));
        }
    } //}
    constants.tool.paste.onclick = () => {
        if(constants.tool.paste.classList.contains("tool-disable"))
            return;
        constants.tool.paste.classList.add("tool-disable");
        paste_action()
        .then(() => {
        }, (err) => {
            debug("paste file");
            // INFORM ERROR TODO
        });
    } //}

    /** <ctrl-c> <ctrl-x> <ctrl-v> */ //{
    let ctrlDown: boolean = false;
    let ctrl_delay = 500;
    const x_keycode = 88;
    const c_keycode = 67;
    const v_keycode = 86;
    html.addEventListener("keydown", (ev: KeyboardEvent) => {
        if(ev.ctrlKey) {
            ctrlDown = true;
            setTimeout(() => {
                ctrlDown = false;
            }, ctrl_delay);
        }
        if(!ctrlDown) return;
        if(ev.keyCode == c_keycode) {
            constants.tool.copy.dispatchEvent(new CustomEvent("click"));
        } else if (ev.keyCode == x_keycode) {
            constants.tool.cut .dispatchEvent(new CustomEvent("click"));
        } else if (ev.keyCode == v_keycode) {
            constants.tool.paste.dispatchEvent(new CustomEvent("click"));
        }
        if(!ev.ctrlKey) ctrlDown = false;
    });
    //}

    /** upload */ //{
    constants.tool.upload_directory.onclick = () => {
        constants.upload_elem_directory.click();
    } 
    constants.upload_elem_directory.oninput = (ev) => {
        ev.preventDefault();
        let entry = util.DirectoryfileListToFileTree("/", (ev.target as any).files);
        let ent = ((ev.target as any).files[0] as any).webkitRelativePath as string;
        let ent_i = ent.indexOf("/");
        if(ent_i > 0)
            ent = ent.substring(0, ent_i);
        entry.name = "/" + ent;
        gvar.Upload.upload.newTask2(entry, gvar.Detail.Details.cwd);
    }
    constants.tool.upload_file.onclick = () => {
        constants.upload_elem_file.click();
    } 
    constants.upload_elem_file.oninput = (ev) => {
        ev.preventDefault();
        let entry = util.MultiplefileListToFileTree("/", (ev.target as any).files);
        gvar.Upload.upload.newTask2(entry, gvar.Detail.Details.cwd);
    }
    //}
    
    /** select */
    function register_select(elem: HTMLElement, childClass: string, selectClass: string, callback: (elem: HTMLElement) => void) //{
    {
        elem.addEventListener("click", (ev: MouseEvent) => {
            let src = ev.target as HTMLElement;
            while(src) {
                if(src.classList.contains(childClass)) break;
                src = src.parentNode as HTMLElement;
                if (src.tagName == "HTML") return;
            }
            if (src == null) return;
            let a = src as Element;
            while (a.nextElementSibling) {
                a = a.nextElementSibling;
                a.classList.remove(selectClass);
            }
            a = src as Element;
            while (a.previousElementSibling) {
                a = a.previousElementSibling;
                a.classList.remove(selectClass);
            }
            src.classList.add(selectClass);
            callback(src);
        });
    } //}

    /** layout */ //{
    register_select(constants.tool.layout, "layout-option", "selected-layout", (elem) => {
        let target = elem.dataset["target"];
        if(target == null) return;
        let origin = [];
        constants.detail_page.classList.forEach((x) => origin.push(x));
        origin.map(x => constants.detail_page.classList.remove(x));
        constants.detail_page.classList.add(target);
    }); //}

    /** sort */ //{
    register_select(constants.tool.sortby, "sort-option", "selected-sort", (elem) => {
        let target = elem.dataset["sort"];
        gvar.Detail.Details.SortBy(target as any);
        return;
    }); 
    register_select(constants.tool.sortby, "reverse-option", "selected-reverse", (elem) => {
        let target = elem.dataset["order"];
        gvar.Detail.Details.Order(target as any);
        return;
    }); //}

}


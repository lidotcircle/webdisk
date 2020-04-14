import * as constants from './constants';
import * as global from './global_vars';
import * as details from './details';
import { debug } from './util';
import * as controller from './controller';
import * as util from './util';

export function SetupTools() {
    /** back parent directory */ //{
    constants.tool.back.addEventListener("click", () => {
        global.Detail.Details.backDir().then(() => {
            debug("click back icon success");
        }, (err) => {
            debug("click back icon fail", err);
        });
    }); //}

    /** refresh */ //{
    constants.tool.refresh.addEventListener("click", () => {
        global.Detail.Details.chdir(global.Detail.Details.cwd).then(() => {
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
    global.Detail.Details.on("change", (n, o) => {
        global.File.manager.rename(o, n, (err) => {
            if(err) {
                debug(err);
                // TODO inform error
            }
            constants.tool.refresh.dispatchEvent(new CustomEvent("click"));
        });
    }); //}

    /** delete selected files */ //{
    constants.tool.del.addEventListener("click", () => {
        let vv = document.querySelectorAll(`.${constants.CSSClass.selected}`);
        let pp: Promise<any>[] = [];
        for(let i=0; i<vv.length; i++) {
            let x = vv[i][constants.KDetailItem] as details.DetailItem;
            if (x == null) continue;
            pp.push(global.File.manager.removeP(x.Stat.filename));
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
        let mm = global.Detail.Details.cwd;
        global.Detail.Details.chdir(p).then(null, (err) => {
            // TODO inform failure
            debug(err);
        });
    });
    address_bar.on("change", (n, o) => {
        global.Detail.Details.chdir(n).then(null, (err) => {
            // TODO inform failure
            debug(err);
        });
    });
    global.Detail.Details.on("chdir", dir => address_bar.setAddr(dir));
    //}

    /** new file */ //{
    constants.tool.new_file.addEventListener("click", () => {
        global.File.manager.newfile(global.Detail.Details.cwd, (err, msg) => {
            let error = null;
            try {
                msg = JSON.parse(msg);
            } catch (e) {error = e;}
            let mm = msg["file"];
            if(err || mm == null || error) {
                // inform failure TODO
                return;
            }
            global.Detail.Details.chdir(global.Detail.Details.cwd).then(() => {
                let xx = global.Detail.Details.QueryItem(util.basename(mm));
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
        global.File.manager.newfolder(global.Detail.Details.cwd, (err, msg) => {
            let error = null;
            try {
                msg = JSON.parse(msg);
            } catch (e) {error = e;}
            let mm = msg["dir"];
            if(err || mm == null || error) {
                // inform failure TODO
                return;
            }
            global.Detail.Details.chdir(global.Detail.Details.cwd).then(() => {
                let xx = global.Detail.Details.QueryItem(util.basename(mm));
                let yy: controller.FilenameBar = xx.toHtmlElement()[constants.KFilenameControl];
                debug(yy);
                yy.editName();
            }, (err) => {
                debug(err);
                // infor failure TODO
            });
        });
    }); //}
}

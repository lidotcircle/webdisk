import * as constants from './constants';
import * as global from './global_vars';
import * as details from './details';
import { debug } from './util';
import * as controller from './controller';

export function SetupTools() {
    /** back parent directory */
    constants.tool.back.addEventListener("click", () => {
        global.Detail.Details.backDir().then(() => {
            debug("click back icon success");
        }, (err) => {
            debug("click back icon fail", err);
        });
    });

    /** refresh */
    constants.tool.refresh.addEventListener("click", () => {
        global.Detail.Details.chdir(global.Detail.Details.cwd).then(() => {
        }, (err) => {
            debug("refresh error: ", err);
        });
    });

    /** delete selected files */
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
    });

    constants.tool.rename.addEventListener("click", () => {
    });

    let address_bar = new controller.AddressBar(constants.CSSClass.hide_elem);
    constants.tool.address.appendChild(address_bar.Elem);
    address_bar.setAddr("/usr/bin");
}


// General //{
export const DISK_PREFIX = '/disk';
//}
//
// Buttons //{
export const login_confirm = document.getElementById("login-submit");
export const login_reset   = document.getElementById("login-reset");
//}

// Inputs //{
export const login_password = document.getElementById("login-password");
export const login_username = document.getElementById("login-username");
//}

// Details //{
export const detail_page = document.getElementById("details-container");
//}

// Directory Tree //{
export const dir_tree = document.getElementById("dir_tree");
//}

// Tool Bar //{
export const tool_bar = document.getElementById("tool-bar");
export namespace tool {
    export const address: HTMLElement     = document.getElementById("tool-address");
    export const upload: HTMLElement     = document.getElementById("tool-upload");
    export const back: HTMLElement     = document.getElementById("tool-back");
    export const new_file: HTMLElement     = document.getElementById("tool-new-folder");
    export const new_folder: HTMLElement     = document.getElementById("tool-new-file");
    export const copy: HTMLElement     = document.getElementById("tool-copy");
    export const cut:  HTMLElement     = document.getElementById("tool-cut");
    export const paste: HTMLElement    = document.getElementById("tool-paste");
    export const rename: HTMLElement   = document.getElementById("tool-rename");
    export const refresh: HTMLElement   = document.getElementById("tool-refresh");
    export const del: HTMLElement      = document.getElementById("tool-delete");
    export const find: HTMLElement     = document.getElementById("tool-find");
    export const settings: HTMLElement = document.getElementById("tool-settings");
}
//}

// homeicon //{
export const homeicon = document.getElementById("homeicon");
//}

// svg template //{
export namespace svg {
    export const folder: HTMLTemplateElement = document.getElementById("svg-filetype-folder") as HTMLTemplateElement;
    export const blank:  HTMLTemplateElement = document.getElementById("svg-filetype-blank") as HTMLTemplateElement;
    export const svg_filetype_prefiex: string = "svg-filetype-";
    export namespace tool {
        export const back:     HTMLElement = document.getElementById("tool-back") as HTMLElement;
        export const copy:     HTMLElement = document.getElementById("tool-copy") as HTMLElement;
        export const cut:      HTMLElement = document.getElementById("tool-back") as HTMLElement;
        export const del:      HTMLElement = document.getElementById("tool-back") as HTMLElement;
        export const edit:     HTMLElement = document.getElementById("tool-back") as HTMLElement;
        export const find:     HTMLElement = document.getElementById("tool-back") as HTMLElement;
        export const paste:    HTMLElement = document.getElementById("tool-back") as HTMLElement;
        export const refresh:  HTMLElement = document.getElementById("tool-back") as HTMLElement;
        export const rename:   HTMLElement = document.getElementById("tool-back") as HTMLElement;
        export const settings: HTMLElement = document.getElementById("tool-back") as HTMLElement;
    }
    export namespace misc {
        export const rarrow: HTMLTemplateElement = document.getElementById('svg-misc-rarrow') as HTMLTemplateElement;
    }
}
//}

// server //{
export const server_ws: string = `ws://${location.host}`;
//}

// CSS //{
export namespace CSSClass {
    export const file_item = "file-item";
    export const file_item_name = "file-item-name";
    export const file_item_icon = "file-item-icon";
    export const selected = "x-selected";
    export const file_item_name_input = "file-item-name-input";
    export const hide_elem = 'x-hide';
};
//}

// Symbol //{
export const KDetailItem = Symbol("detailItem");
export const KFilenameControl = Symbol("FilenameControl");
//}

// Regex //{
export namespace Regex {
    export const validPathname = /^\/([\w\-. ]+\/)*([\w\-. ]+)?$/;
}
//}


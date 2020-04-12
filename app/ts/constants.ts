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
export const tool_bar = document.getElementById("tool_bar");
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
        export const copy: HTMLTemplateElement = null;
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
};
//}


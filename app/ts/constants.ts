// General //{
export const DISK_PREFIX = '/disk';
//}

// Buttons //{
export const login_confirm = document.getElementById("login-submit");
export const login_reset   = document.getElementById("login-reset");
//}

// Login //{
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
export const upload_elem_directory: HTMLElement = document.getElementById("directory-input");
export const upload_elem_file: HTMLElement      = document.getElementById("file-input");
export namespace tool {
    export const address: HTMLElement     = document.getElementById("tool-address");
    export const upload_file: HTMLElement     = document.getElementById("tool-upload-file");
    export const upload_directory: HTMLElement     = document.getElementById("tool-upload-directory");
    export const back: HTMLElement     = document.getElementById("tool-back");
    export const new_file: HTMLElement     = document.getElementById("tool-new-file");
    export const new_folder: HTMLElement     = document.getElementById("tool-new-folder");
    export const copy: HTMLElement     = document.getElementById("tool-copy");
    export const cut:  HTMLElement     = document.getElementById("tool-cut");
    export const paste: HTMLElement    = document.getElementById("tool-paste");
    export const rename: HTMLElement   = document.getElementById("tool-rename");
    export const refresh: HTMLElement   = document.getElementById("tool-refresh");
    export const del: HTMLElement      = document.getElementById("tool-delete");
    export const layout: HTMLElement      = document.getElementById("tool-layout");
    export const sortby: HTMLElement      = document.getElementById("tool-sortby");
    export const find: HTMLElement     = document.getElementById("tool-find");
    export const settings: HTMLElement = document.getElementById("tool-settings");
}
//}

// Bottom //{
export namespace Bottom {
    export const message_bar = document.getElementById("message-bar");
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
export const server_ws: string = `${location.protocol == 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
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
export const KScreenPrevDragOver = Symbol("confirm window");
//}

// Regex //{
export namespace Regex {
    export const validPathname = /^\/([^\/]+\/)*([^\/]+)?$/;
}
//}

// Misc //{
export namespace Misc {
    export const BufferSize: number = 1024 * 1024;
    export const WindowSize: number = 8;
}
//}


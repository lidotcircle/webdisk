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
}
//}

// server //{
export const server_ws: string = `ws://${location.host}`;
//}


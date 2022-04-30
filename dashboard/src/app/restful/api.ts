const API_ADDRESS = window.location.origin;

export module API {
    export module Auth {
        export const login  = API_ADDRESS + '/apis/auth/token';
        export const jwt    = API_ADDRESS + '/apis/auth/jwt';
        export const signup = API_ADDRESS + '/apis/auth/user';

        export const requestReset = API_ADDRESS + '/apis/auth/reset-password/token';
        export const reset        = API_ADDRESS + '/apis/auth/reset-password/password';
    }

    export module User {
        export const deleteUser = API_ADDRESS + '/apis/user/account';
        export const info   = API_ADDRESS + '/apis/user';
        export const update = API_ADDRESS + '/apis/user';
        export const updatePrivileged = API_ADDRESS + '/apis/user/privileged';
        export const descriptors      = API_ADDRESS + '/apis/user/descriptor';

        export const password = API_ADDRESS + '/apis/user/basic-info/password';
        export const basicInfo = API_ADDRESS + '/apis/user/basic-info';
        export const avatar = API_ADDRESS + '/apis/user/avatar';
        export const frontendSetting = API_ADDRESS + '/apis/user/setting/frontend';

        export const InvCode = API_ADDRESS + '/apis/user/invite-code';
        export const InvCodePerms = API_ADDRESS + '/apis/user/invite-code/perms';
        export const InvCodeUser  = API_ADDRESS + '/apis/user/invite-code/user';
    }

    export module Note {
        export const note = API_ADDRESS + '/apis/note';
        export const single = API_ADDRESS + '/apis/note/single';
        export const title = API_ADDRESS + '/apis/note/title';
        export const tags = API_ADDRESS + '/apis/note/tags';
        export const history = API_ADDRESS + '/apis/note/history';
        export const mergeHistory = API_ADDRESS + '/apis/note/history/mergeall';
        export const generation = API_ADDRESS + '/apis/note/generation';
    }

    export const NamedLink = API_ADDRESS + '/apis/named-link';

    export module DataRecord {
        export const groups = API_ADDRESS + '/apis/sdata/groups';
        export const groupData = API_ADDRESS + '/apis/sdata/data';
        export const groupAllData = API_ADDRESS + '/apis/sdata/alldata';
        export const record = API_ADDRESS + '/apis/sdata';
    }

    export const PassStore = API_ADDRESS + '/apis/passstore';
    export const SToken = API_ADDRESS + '/apis/stoken';
}


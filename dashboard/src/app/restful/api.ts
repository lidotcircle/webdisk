const API_ADDRESS = window.location.origin;

export module API {
    export module Auth {
        export const login  = API_ADDRESS + '/apis/auth/token';
        export const jwt    = API_ADDRESS + '/apis/auth/jwt';
        export const signup = API_ADDRESS + '/apis/auth/user';

        export const requestReset = API_ADDRESS + '/apis/auth/password/reset-token';
        export const reset        = API_ADDRESS + '/apis/auth/password';
    }

    export module User {
        export const info   = API_ADDRESS + '/apis/user';
        export const update = API_ADDRESS + '/apis/user';
        export const updatePrivileged = API_ADDRESS + '/apis/user/privileged';
        export const descriptors      = API_ADDRESS + '/apis/user/descriptor';
    }

    export module DataRecord {
        export const groups = API_ADDRESS + '/apis/sdata/groups';
        export const groupData = API_ADDRESS + '/apis/sdata/data';
        export const groupAllData = API_ADDRESS + '/apis/sdata/alldata';
        export const record = API_ADDRESS + '/apis/sdata';
    }
}

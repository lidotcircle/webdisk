export * from '../../../../lib/common/message';
export * from '../../../../lib/common/user_message';
export * from '../../../../lib/common/file_message';
export * from '../../../../lib/common/db_types';
export * from '../../../../lib/common/ecode';

export module CONS {
    export module Keys {
        const LOGIN_TOKEN: string = 'LOGIN_TOKEN';
    }

    export const wsurl: string = `${location.protocol == 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
    export const WS_RETRY_BASE: number = 2000;
}


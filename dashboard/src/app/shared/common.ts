export * from '../../../../lib/common/message/message';
export * from '../../../../lib/common/message/user_message';
export * from '../../../../lib/common/message/misc_message';
export * from '../../../../lib/common/message/file_message';
export * from '../../../../lib/common/db_types';
export * from '../../../../lib/common/ecode';
export * from '../../../../lib/common/file_types';
export * from '../../../../lib/common/user_settings';

export module CONS {
    export module Keys {
        export const LOGIN_TOKEN: string = 'LOGIN_TOKEN';
    }

    export const wsurl: string = `${location.protocol == 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
    export const WS_RETRY_BASE: number = 2000;
}


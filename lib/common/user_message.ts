import { MessageType, MessageId, MessageAck, BasicMessage } from './message';
import { UserInfo, Token, NameEntry } from './db_types';
import { UserSettings } from './user_settings';

export enum UserMessageType {
    Login = "LOGIN",
    Logout = "LOGOUT",

    GetBasicUserInfo = "GetUserInfo",
    SetBasicUserInfo = "SetUserInfo",

    AddUser    = "ADD_USER",
    RemoveUser = "REMOVE_USER",

    GenerateInvitationCode = "GENERATE_INVITATIONCODE",
    GetInvitationCode      = "GET_INVITATIONCODE",

    ChangePassword = "CHANGE_PASSWORD",

    GetUserSettings = "GET_USER_SETTINGS",
    UpdateUserSettings = "UPDATE_USER_SETTINGS",

    ShortTermTokenGenerate = "SHORT_TERM_TOKEN_GEN",
    ShortTermTokenClear = "SHORT_TERM_TOKEN_CLEAR",

    NewNameEntry = "NEW_NAME_ENTRY",
    GetNameEntry = "GET_NAME_ENTRY",
    GetAllNameEntry = "GET_ALL_NAME_ENTRY",
    DeleteNameEntry = "DELETE_NAME_ENTRY",
    DeleteAllNameEntry = "DELETE_ALL_NAME_ENTRY",

    Uninit = "UNINIT"
}

export class UserMessage extends BasicMessage {
    public messageType = MessageType.UserManagement;
    public um_type: UserMessageType = UserMessageType.Uninit;
    public um_msg: any = {};
}

export interface UserMessageLoginRequest extends UserMessage {
    um_msg: {
        username: string,
        password: string
    }
}
export interface UserMessageLoginResponse extends UserMessage {
    um_msg: {
        token: Token
    }
}
export interface UserMessageLogoutRequest extends UserMessageLoginResponse {}

export interface UserMessageGetUserInfoRequest  extends UserMessageLoginResponse {}
export interface UserMessageGetUserInfoResponse extends UserMessage {
    um_msg: UserInfo
}

export interface UserMessageSetUserInfoRequest extends UserMessage {
    um_msg: {
        token: Token,
        newInfo: UserInfo
    }
}

export interface UserMessageAddUserRequest extends UserMessage {
    um_msg: {
        token: Token;
        username: string,
        password: string,
        invitationCode: string
    }
}

export interface UserMessageRemoveUserRequest extends UserMessage {
    um_msg: {
        token: string,
        username: string,
        password: string
    }
}

export interface UserMessageGenInvCodeRequest extends UserMessage {
    um_msg: {
        token: Token,
        n: number
    }
}

export interface UserMessaageGetInvCodeRequest extends UserMessage {
    um_msg: {
        token: Token
    }
}
export interface UserMessaageGetInvCodeResponse extends UserMessage {
    um_msg: {
        InvCodes: string[]
    }
}

export interface UserMessageChangePasswordRequest extends UserMessage {
    um_msg: {
        token: Token,
        oldpass: string,
        newpass: string
    }
}

export interface UserMessageGetUserSettingsRequest extends UserMessage {
    um_msg: {
        token: Token
    }
}

export interface UserMessageGetUserSettingsResponse extends UserMessage {
    um_msg: {
        userSettings: UserSettings
    }
}

export interface UserMessageUpdateUserSettingsRequest extends UserMessage {
    um_msg: {
        token: Token,
        userSettings: UserSettings
    }
}

export interface UserMessageShortTermTokenGenerateRequest extends UserMessage {
    um_msg: {
        token: Token,
    }
}

export interface UserMessageShortTermTokenGenerateResponse extends UserMessage {
    um_msg: {
        shortTermToken: Token,
    }
}

export interface UserMessageShortTermTokenClearRequest extends UserMessage {
    um_msg: {
        token: Token,
    }
}

export interface UserMessageNewNameEntryRequest extends UserMessage {
    um_msg: {
        token: Token,
        name: string,
        destination: string,
        validPeriodMS: number
    }
}

export interface UserMessageGetNameEntryRequest extends UserMessage {
    um_msg: {
        token: Token,
        name: string
    }
}

export interface UserMessageGetNameEntryResponse extends UserMessage {
    um_msg: {
        entry: NameEntry;
    }
}

export interface UserMessageGetAllNameEntryRequest extends UserMessage {
    um_msg: {
        token: Token
    }
}

export interface UserMessageGetAllNameEntryResponse extends UserMessage {
    um_msg: {
        entries: NameEntry[];
    }
}

export interface UserMessageDeleteNameEntryRequest extends UserMessage {
    um_msg: {
        token: Token,
        name: string
    }
}

export interface UserMessageDeleteAllNameEntryRequest extends UserMessage {
    um_msg: {
        token: Token,
    }
}


import { NameEntry, Token, UserInfo } from "../common/db_types";

export module DBRelations {
    export class User extends UserInfo {
        uid: number;
        password: string;
        invitationCode: string;
    }

    export class InvitationCode {
        ownerUid: number;
        invitationCode: string;
        invitedUid: number;
        permission: string;
    }

    export class AuthenticationToken {
        token: Token;
        uid:   number;
        last:  number;
    }

    export class ShortTermToken {
        token:   Token;
        ATtoken: Token;
        start:   number;
    }

    export class UserSettings {
        uid: number;
        settings: string;
    }

    export class FileEntryNameMapping extends NameEntry {
        uid: number = -1;
    }
}


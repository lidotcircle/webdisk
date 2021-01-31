import { cons } from "../utils";
import { DBRelations } from "./relations";
import * as proc from 'process';

export const LAST_ACTIVATION_SPAN       = (5 * 24 * 60 * 60 * 1000);
export const SHORT_TERM_TOKEN_LIVE_TIME = cons.ShortTermTokenValidPeriod;
export const INVITAION_CODE_LENGTH      = 56;
export const TOKEN_LENGTH               = 56;

export const KEY_USER               = 'users';
export const KEY_INVITATION         = 'invitation';
export const KEY_TOKEN              = 'tokens';
export const KEY_SHORTTERM_TOKEN    = 'short_term_token';
export const KEY_USER_SETTINGS      = 'settings';
export const KEY_FILE_ENTRY_MAPPING = 'entry_mapping';

export const RootUserInfo: DBRelations.User = new DBRelations.User();
RootUserInfo.uid            = 1;
RootUserInfo.username       = 'administrator';
RootUserInfo.password       = 'e10adc3949ba59abbe56e057f20f883e'; // MD5 of 123456
RootUserInfo.rootPath       = proc.env["HOME"];
RootUserInfo.invitationCode = 'ROOT_DOESNT_NEED_INVITATION_CODE';
RootUserInfo.createTime     = Date.now();

export const RootInvitation: DBRelations.InvitationCode = new DBRelations.InvitationCode();
RootInvitation.ownerUid       = RootUserInfo.uid;
RootInvitation.invitationCode = RootUserInfo.invitationCode;
RootInvitation.permission     = '{}';
RootInvitation.invitedUid     = RootUserInfo.uid;


import { MessageType, MessageId, MessageAck, BasicMessage } from './message';

export enum FileMessageType {
    Request  = "REQUEST",
    Response = "RESPONSE",
    Event    = "EVENT",
    Uninit   = "UNINIT"
}

export class FileMessage extends BasicMessage {
    public messageType = MessageType.FileManagement;
    public fm_type: FileMessageType = FileMessageType.Uninit;
    public fm_msg: any = null;
}

export enum FileRequest {
    CHMOD          = "CHMOD",
    COPY           = "COPY",
    COPYR          = "COPYR",
    EXECUTE        = "EXECUTE",
    GETDIR         = "GETDIR",
    INVALID        = "INVALID",
    MKDIR          = "MKDIR",
    MOVE           = "MOVE",
    READ           = "READ",
    REMOVE         = "REMOVE",
    REMOVER        = "REMOVER",
    STAT           = "STAT",
    TOUCH          = "TOUCH",
    TRUNCATE       = "TRUNCATE",
    WRITE          = "WRITE",
    FILEMD5        = "FILEMD5",
}

export class FileRequestMessage extends FileMessage {
    fm_msg = {
        user_token: null,
        fm_request: FileRequest.INVALID,
        fm_request_argv: [],
    }
}

export class FileResponseMessage extends FileMessage {
    fm_msg = {
        fm_response: null,
    }
}

export enum FileEvent
{
    REMOVE   = "REMOVE",
    MOVE     = "MOVE",
    MODIFIED = "MODIFIED",
    CHMOD    = "CHMOD",
    CHOWN    = "CHOWN",
    NEW      = "NEW",
    INVALID  = "INVALID"
}

export class FileEventMessage extends FileMessage {
    fm_msg = {
        fm_event: FileEvent.INVALID,
        fm_event_argv: [],
    }
}


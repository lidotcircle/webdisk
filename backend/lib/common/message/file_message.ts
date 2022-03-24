import { MessageType, MessageId, MessageAck, BasicMessage, MessageSource } from './message';

export class FileMessage extends BasicMessage {
    public messageType = MessageType.FileManagement;
    public messageSource = MessageSource.Request;
    public fm_msg: any = null;
}

export enum FileRequest {
    APPEND         = "APPEND",
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
    FILEMD5_SLICE  = "FILEMD5_SLICE",
}

export class FileRequestMessage extends FileMessage {
    fm_msg = {
        fm_request: FileRequest.INVALID,
        fm_request_argv: [],
    }
}

export class FileResponseMessage extends FileMessage {
    messageSource = MessageSource.Response;
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
    messageSource = MessageSource.Event;
    fm_msg = {
        fm_event: FileEvent.INVALID,
        fm_event_argv: [],
    }
}


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
    RENAME         = "RENAME",
    STAT           = "STAT",
    TOUCH          = "TOUCH",
    TRUNCATE       = "TRUNCATE",
    WRITE          = "WRITE",
    UPLOAD         = "UPLOAD",
    UPLOAD_WRITE   = "UPLOAD_WRITE",
    UPLOAD_WRITE_B = "UPLOAD_WRITE_B",
    UPLOAD_MERGE   = "UPLOAD_MERGE",
    NEW_FOLDER     = "NEW_FOLDER",
    NEW_FILE       = "NEW_FILE"
}

export class FileRequestMessage extends FileMessage {
    public fm_request: FileRequest = FileRequest.INVALID;
    public fm_request_argv: string[] = [];
}

export class FileResponseMessage extends FileMessage {
    public fm_response: any = null;
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
    public fm_event: FileEvent = FileEvent.INVALID;
    public fm_event_argv: string[] = [];
}


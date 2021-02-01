import { DownloadTask } from './db_types';
import { MessageType, BasicMessage } from './message';

export enum MiscMessageType {
    RPC_REQUEST  = "RPC_REQUEST",
    RPC_RESPONSE = "RPC_RESPONSE",
    EVENT = "EVENT",

    DownloadManage = "DOWNLOAD_MANAGE",
    DownloadEvent = "DOWNLOAD_EVENT",

    Uninit   = "UNINIT"
}

export class MiscMessage extends BasicMessage {
    public messageType = MessageType.MiscManagement;
    public misc_type: MiscMessageType = MiscMessageType.Uninit;
    public misc_msg: any = null;
}

export class RPCRequestMessage extends MiscMessage {
    misc_msg = {
        function_name: '',
        function_argv: []
    }
}

export class RPCResponseMessage extends MiscMessage {
    misc_msg = {
        function_response: null
    }
}


export enum DownloadManage {
    NEW_TASK      = 'NEW_TASK',
    DELETE_TASK   = 'DELETE_TASK',
    GET_TASKS     = 'GET_TASKS',
    INSEPECT_TASK = 'INSEPECT_TASK'
}

export class DownloadManageMessage extends MiscMessage {
    misc_type: MiscMessageType = MiscMessageType.DownloadManage;
    dlm_type: DownloadManage = DownloadManage.NEW_TASK;
    misc_msg: {} = {};
}

export class DownloadManageNewTaskMessage extends DownloadManageMessage {
    dlm_type: DownloadManage = DownloadManage.NEW_TASK;
    misc_msg: {token: string, url: string, destination: string};
}

export class DownloadManageNewTaskResponseMessage extends DownloadManageMessage {
    misc_msg: {taskId: number};
}

export class DownloadManageDeleteTaskMessage extends DownloadManageMessage {
    dlm_type: DownloadManage = DownloadManage.DELETE_TASK;
    misc_msg: {token: string, taskId: number};
}

export class DownloadManageGetTasksMessage extends DownloadManageMessage {
    dlm_type: DownloadManage = DownloadManage.GET_TASKS;
    misc_msg: {token: string};
}

export class DownloadManageGetTasksResponseMessage extends DownloadManageMessage {
    dlm_type: DownloadManage = DownloadManage.GET_TASKS;
    misc_msg: {tasks: DownloadTask[]};
}

export class DownloadManageInspectTaskMessage extends DownloadManageMessage {
    dlm_type: DownloadManage = DownloadManage.INSEPECT_TASK;
    misc_msg: {token: string, taskId: number};
}


export enum DownloadManageEvent {
    UPDATE = "UPDATE",
    FINISH = "FINISH",
    FAIL   = "FAIl"
}
export class DownloadManageEventMessage extends MiscMessage {
    misc_type: MiscMessageType = MiscMessageType.DownloadEvent;
    event_type: DownloadManageEvent = DownloadManageEvent.UPDATE;
}

export class DownloadManageEventUpdateMessage extends DownloadManageEventMessage {
    event_type: DownloadManageEvent = DownloadManageEvent.UPDATE;
    misc_msg: {taskid: number, size: number};
}

export class DownloadManageEventSuccessMessage extends DownloadManageEventMessage {
    event_type: DownloadManageEvent = DownloadManageEvent.UPDATE;
    misc_msg: {taskid: number, size: number};
}

export class DownloadManageEventFailMessage extends DownloadManageEventMessage {
    event_type: DownloadManageEvent = DownloadManageEvent.FAIL;
    misc_msg: {taskid: number};
}

export class DownloadManageEventFinishMessage extends DownloadManageEventMessage {
    event_type: DownloadManageEvent = DownloadManageEvent.FINISH;
    misc_msg: {taskid: number};
}


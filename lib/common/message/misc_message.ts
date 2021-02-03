import { DownloadTask, StorePassword } from '../db_types';
import { MessageType, BasicMessage, MessageSource } from './message';

export enum MiscMessageType {
    RPC            = "RPC",
    DownloadManage = "DOWNLOAD_MANAGE",
    StorePassword  = "STORE_PASS",
    Uninit         = "UNINIT"
}

export class MiscMessage extends BasicMessage {
    public messageType = MessageType.MiscManagement;
    public misc_type: MiscMessageType = MiscMessageType.Uninit;
    public misc_msg: any = {};
}

export class RPCRequestMessage extends MiscMessage {
    messageSource = MessageSource.Request;
    misc_type = MiscMessageType.RPC;
    misc_msg = {
        function_name: '',
        function_argv: []
    }
}

export class RPCResponseMessage extends MiscMessage {
    messageSource = MessageSource.Response;
    misc_type = MiscMessageType.RPC;
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
    messageSource = MessageSource.Request;
    misc_type: MiscMessageType = MiscMessageType.DownloadManage;
    dlm_type: DownloadManage = DownloadManage.NEW_TASK;
    misc_msg: {} = {};
}

export class DownloadManageNewTaskMessage extends DownloadManageMessage {
    dlm_type: DownloadManage = DownloadManage.NEW_TASK;
    misc_msg: {token: string, url: string, destination: string};
}

export class DownloadManageNewTaskResponseMessage extends DownloadManageMessage {
    messageSource = MessageSource.Response;
    misc_msg: {task: DownloadTask};
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
    messageSource = MessageSource.Response;
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
    misc_type = MiscMessageType.DownloadManage;
    messageSource = MessageSource.Event;
    event_type: DownloadManageEvent = DownloadManageEvent.UPDATE;
}

export class DownloadManageEventUpdateMessage extends DownloadManageEventMessage {
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


export enum StorePasswordType {
    NewPass = "NEW_PASS",
    GetPass = "GET_PASS",
    DeletePass = "DELETE_PASS",
    ChangePass = "CHANGE_PASS"
}
export class StorePasswordMessage extends MiscMessage {
    misc_type = MiscMessageType.StorePassword;
    sp_type: StorePasswordType = StorePasswordType.NewPass;
}

export class StorePasswordTypeNewPassMessage extends StorePasswordMessage {
    misc_msg: {token: string, store: StorePassword}
}
export class StorePasswordTypeNewPassResponseMessage extends StorePasswordMessage {
    misc_msg: {passid: number}
}
export class StorePasswordTypeChangePassMessage extends StorePasswordMessage {
    sp_type = StorePasswordType.ChangePass;
    misc_msg: {token: string, passid: number, pass: string}
}
export class StorePasswordTypeDeletePassMessage extends StorePasswordMessage {
    sp_type = StorePasswordType.DeletePass;
    misc_msg: {token: string, passid: number}
}
export class StorePasswordTypeGetPassMessage extends StorePasswordMessage {
    sp_type = StorePasswordType.GetPass;
    misc_msg: {token: string}
}
export class StorePasswordTypeGetPassResponseMessage extends StorePasswordMessage {
    sp_type = StorePasswordType.GetPass;
    misc_msg: {stores: StorePassword[]}
}


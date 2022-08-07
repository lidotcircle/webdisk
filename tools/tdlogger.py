import io
import json
from subprocess import Popen, PIPE
import sys
import os
import argparse
import asyncio
import regex
import zlib
from tqdm import tqdm
from typing import Tuple, Union, List
from aiohttp import ClientSession
from base64 import decodebytes, encodebytes


queue_clear_message = "QUEUE_CLEAR"


class TdLogger:
    def __init__(self, endpoint: str, default_group: str, bufferQueueSize: int, credential: Union[str, Tuple[str,str]], 
                 timeout: int = 5, hint_done: bool = False, priority: bool=False, group_prefix: str = "", disabled: bool = False):
        self.endpoint = endpoint
        self.default_group = default_group
        self.bufferQueueSize = bufferQueueSize
        self.timeout = timeout
        self.credential = credential
        self.hint_done = hint_done
        self.priority = priority
        self.group_prefix = group_prefix
        self.disabled = disabled
        assert(self.credential != "")
        if not self.disabled:
            self.__start_subprocess()
        self.__data_list: List[dict] = []
        self.__highest_priroty = 9999

    def __start_subprocess(self):
        args = [
                    sys.executable, os.path.realpath(__file__), 
                    "--child_mode",
                    "--endpoint", self.endpoint, 
                    "--timeout", str(self.timeout)
                ]

        if (type(self.credential) == tuple):
            args += ["--username", self.credential[0], "--password", self.credential[1]]
        else:
            args += ["--grouptoken", self.credential]
        
        if not self.hint_done:
            args += ["--disable_hint_done"]
        if self.priority:
            args += ["--priority"]

        self._subpipe = Popen(args, stdin=PIPE, stderr=PIPE, text=True) if self.hint_done else Popen(args, stdin=PIPE, text=True)
    
    def wait(self):
        if self._subpipe is None:
            return
        
        self.__send_eof()
        self._subpipe.wait()
    
    def wait_clear(self):
        if self._subpipe is None or not self.hint_done:
            return
        while True:
            msg = self._subpipe.stderr.readline()
            if msg.strip() == queue_clear_message:
                break

    def debug(self, msg: str):
        self.send({"message": msg, "level": "debug"}, group=self.default_group + '-log', direct = True)

    def info(self, msg: str):
        self.send({"message": msg, "level": "info"}, group=self.default_group + '-log', direct = True)

    def warning(self, msg: str):
        self.send({"message": msg, "level": "warning"}, group=self.default_group + '-log', direct = True)

    def error(self, msg: str):
        self.send({"message": msg, "level": "error"}, group=self.default_group + '-log', direct = True)

    def send(self, data: dict, group: str = "", direct: bool = False, priority=0):
        group = group if group != "" else self.default_group
        if direct or self.bufferQueueSize < 2:
            self.__sendSData(data, group, priority)
        else:
            self.__data_list.append({'group': group, 'data': data})
            self.__highest_priroty = min(self.__highest_priroty, priority)
            if len(self.__data_list) >= self.bufferQueueSize:
                self.__sendListofSData(self.__data_list)
                self.__data_list = []
                self.__highest_priroty = 9999

    def flush(self, priority: int=0):
        if len(self.__data_list) > 0:
            self.__sendListofSData(self.__data_list)
            self.__data_list = []
            self.__highest_priroty = 9999

    def __sendSData(self, data: dict, group: str, priority: int):
        payload = json.dumps({ "data": data, "group": self.group_prefix + group })
        self.__sendmsg("sdata", payload, priority)

    def __sendListofSData(self, datas: List[dict]):
        payload = json.dumps(datas)
        self.__sendmsg("listofsdata", payload, self.__highest_priroty)

    def sendBlobFile(self, file: Tuple[str,bytes,io.BytesIO], blobname: str, dst: str, group: str, priority: int=3):
        data: bytes = None

        if isinstance(file, str):
            with io.open(file, mode = "rb") as image_file:
                data = image_file.read()
        elif isinstance(file, io.BytesIO):
            data = file.getvalue()
        elif isinstance(file, bytes):
            data = file

        self.sendBlob(data, blobname, dst, group, priority)

    def sendBlob(self, blob: bytes, blobname: str, dst: str, group: str, priority: int=3):
        blob_b64 = encodebytes(blob).decode("ascii")
        msg = json.dumps({
            "blobB64": blob_b64,
            "blobname": blobname,
            "destination": dst,
            "group": self.group_prefix + group,
        })
        self.__sendmsg("blob", msg, priority)

    def __sendmsg(self, msgtype: str, payload: str, priority: int):
        if self.disabled:
            return
        msg = json.dumps({"type": msgtype, "msg": payload, "priority": priority})
        if (self._subpipe.stdin != None):
            try:
                self._subpipe.stdin.write(msg + "\n")
                self._subpipe.stdin.flush()
            except BrokenPipeError:
                self.__start_subprocess()
                self.__sendmsg(msgtype, payload)

    def __send_eof(self):
        if self.disabled:
            return
        if self._subpipe and self._subpipe.stdin:
            self._subpipe.stdin.close()


class HttpLogger:
    def __init__(self, endpoint: str, timeout: float,
                 grouptoken: str = "",
                 hint_done: bool = False,
                 priority: bool = False,
                 username: str = "", password: str = ""):
        self.endpoint = endpoint
        self.timeout = timeout
        self.grouptoken = grouptoken
        self.hint_done = hint_done
        self.priority = priority
        self.username = username
        self.password = password
        self.__msg_queue = []
        self.__end = False
        self.__API_sdata = "/apis/sdata"
        self.__API_listofsdata = "/apis/sdata/list"
        self.__API_blob =  "/apis/flink"
        self.__total_msg_length = 0

    def getAPI(self, urlpath: str):
        if self.endpoint.endswith("/"):
            endp = self.endpoint[:-1]
            return endp + urlpath
        else:
            return self.endpoint + urlpath

    def authHeaders(self, headers: dict):
        if self.username != "":
            headers["x-username"] = self.username or ''
            headers["x-password"] = self.password or ''
        if self.grouptoken != "":
            headers["x-grouptoken"] = self.grouptoken or ''

    async def postSData(self, session: ClientSession, data: str, group: str):
        await self.__post_body(self.getAPI(self.__API_sdata), session, {'group': group, 'data': data})

    async def postListofSData(self, session: ClientSession, datas: list):
        await self.__post_body(self.getAPI(self.__API_listofsdata), session, { 'datas': datas })

    async def __post_body(self, url, session: ClientSession, body_data: object):
        data = bytearray(json.dumps(body_data), 'utf-8')
        data = zlib.compress(data)

        headers = { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'deflate' }
        self.authHeaders(headers)

        async with session.post(url, data=data, headers=headers, timeout=self.timeout) as resp:
            if resp.status != 200:
                print("HTTP Error: " + str(resp.status), ", send ", data, " failed")
                raise Exception("send sdata failed: %s" % (str(resp.status)))

    async def postBlob(self, session: ClientSession, blob: bytes, dst: str) -> str:
        headers = { }
        self.authHeaders(headers)

        url = self.getAPI(self.__API_blob)
        async with  session.post(url, headers=headers, params={"filepath": dst}, data=blob) as resp:
            if resp.status != 200:
                print("HTTP Error: %s, %s. send blob failed" % (str(resp.status), (await resp.text())))
                raise Exception("send blob failed: %s" % (str(resp.status)))
            jsonresp = await resp.json()
            if "fileid" not in jsonresp:
                raise Exception("bad response from server, expect 'fileid'")
            fileid = jsonresp["fileid"]
            if not isinstance(fileid, str):
                raise Exception("bad response from server, 'fileid' should be string")
            return fileid

    async def handler_sdata(self, session: ClientSession, payload: str):
        obj = json.loads(payload)
        data = obj["data"]
        group = obj["group"]
        await self.postSData(session, json.dumps(data), group)

    async def handler_listofsdata(self, session: ClientSession, payload: str):
        obj = json.loads(payload)
        assert isinstance(obj, list)
        thelist = []
        for msg in obj:
            assert 'group' in msg and 'data' in msg
            thelist.append({'group': msg["group"], 'data': json.dumps(msg['data'])})
        await self.postListofSData(session, thelist)

    async def handler_blob(self, session: ClientSession, payload: str):
        obj = json.loads(payload)
        group = obj["group"]
        blobname = obj["blobname"]
        dst = obj["destination"]

        blobb64: str = obj["blobB64"]
        blobbytes = blobb64.encode()
        blob = decodebytes(blobbytes)

        fileid = await self.postBlob(session, blob, dst)
        fileurl = self.__API_blob + "/" + fileid
        if group is not None and group != "":
            await self.postSData(session, json.dumps({ "url": fileurl, "name": blobname }), group)

    async def readline(self):
        return await asyncio.get_running_loop().run_in_executor(None, sys.stdin.readline)

    async def __run_fetchmsg(self):
        while True:
            msg = await self.readline()
            msg = msg and msg.strip()
            self.__msg_event.set()
            if msg is None or len(msg) == 0:
                self.__end = True
                break
            msgobj = json.loads(msg)
            msgpriority = msgobj['priority']
            insert_idx = len(self.__msg_queue)
            # TODO binary search and linked-list
            if self.priority:
                for i in range(len(self.__msg_queue)):
                    if self.__msg_queue[i]['priority'] > msgpriority:
                        insert_idx = i
                        break
            self.__msg_queue.insert(insert_idx, msgobj)
            self.__total_msg_length = self.__total_msg_length + 1

    async def __run_dispatchmsg(self):
        while True:
            if len(self.__msg_queue) == 0 and self.__total_msg_length > 0 and self.hint_done:
                print(f"\n{queue_clear_message}", file=sys.stderr)
            if (self.__end and len(self.__msg_queue) == 0):
                break
            if len(self.__msg_queue) == 0:
                await self.__msg_event.wait()
                self.__msg_event.clear()
            async with ClientSession() as session:
                while len(self.__msg_queue) > 0:
                    msgobj: dict = self.__msg_queue.pop(0)
                    msgtype = msgobj["type"]
                    payload = msgobj["msg"]

                    try:
                        if msgtype == "blob":
                            await self.handler_blob(session, payload)
                        elif msgtype == "sdata":
                            await self.handler_sdata(session, payload)
                        elif msgtype == "listofsdata":
                            await self.handler_listofsdata(session, payload)
                        else:
                            raise NotImplemented(f"message type '{msgtype}' is not implemented")
                    except Exception as e:
                        msg = json.dumps(msgobj)
                        shortmsg = msg[0:min(len(msg), 200)]
                        if len(shortmsg) < len(msg):
                            shortmsg += "..."
                        print("%s: %s, when sending [%s], timeout=%s" % (type(e).__name__, str(e), shortmsg, self.timeout))
                        break

    async def run(self):
        self.__msg_event = asyncio.Event()
        await asyncio.gather(self.__run_fetchmsg(), self.__run_dispatchmsg())


parser = argparse.ArgumentParser(description='Message Logger')
parser.add_argument('--child_mode', action='store_true', help='switch to child mode, run as waiting parent process message to process')
parser.add_argument('-a', '--endpoint',   type=str,   help='endpoint to post msg', required=True)
parser.add_argument('-t', '--timeout',    type=float, help='http request timeout in seconds', default=5)
parser.add_argument(      '--priority',   action='store_true', help='enalbe message priority')
parser.add_argument('-u', '--username',   type=str,   help='service username', default=None)
parser.add_argument('-p', '--password',   type=str,   help='service password', default=None)
parser.add_argument('-c', '--grouptoken', type=str,   help='service grouptoken', default=None)
parser.add_argument('--disable_hint_done', action='store_true', help='hint_done: when message be consumed, child process send a message to stderr')

parser.add_argument('-g', '--group', type=str, help='group, only for parent mode', default="")
parser.add_argument('-l', '--level', type=str, choices=['info', 'debug', 'warn', 'error'], help='message level, only for parent mode', default='info')
parser.add_argument('-m', '--message', type=str, help='message, only for parent mode', default=None)
parser.add_argument('-r', '--remote_dir', type=str, help='remote direcotry, only for parent mode', default=None)
parser.add_argument('-f', '--file', type=str, help='file for uploading, only for parent mode', default=None)
parser.add_argument('-d', '--dir',  type=str, help='directory for uploading, only for parent mode', default=None)
parser.add_argument('-s', '--dir_skipn',  type=int, help='skip first n files, for continuing uploading', default=0)
parser.add_argument('-x', '--pattern', type=str, help='file pattern for directory uploading', default=None)

def child_mode_action(args: argparse.Namespace):
    httplogger = HttpLogger(args.endpoint, args.timeout, 
                            hint_done=not args.disable_hint_done,
                            priority=args.priority,
                            username=args.username, password=args.password, 
                            grouptoken=args.grouptoken)
    asyncio.run(httplogger.run())

def parent_mode_action(args: argparse.Namespace):
    credential = (args.username, args.password)
    if credential[0] is None:
        credential = args.grouptoken
    
    if credential is None:
        raise argparse.ArgumentError("credential is required")
    
    def to_slash_path(fp: str) -> str:
        fp = fp.replace('\\', '/')
        if len(fp) > 1 and fp[1] == ':':
            fp = fp[2:]
        return fp

    logger = TdLogger(args.endpoint, args.group, 1, credential, hint_done=not args.disable_hint_done, priority=args.priority)
    if args.message is not None:
        data = {}
        data['level'] = args.level
        data['message'] = args.message
        logger.send(data)
    elif args.file is not None:
        if args.remote_dir is None:
            raise argparse.ArgumentError("'--remote_dir' is required for uploading file")
        basename = os.path.basename(args.file)
        dst = os.path.join(args.remote_dir, basename)
        dst = to_slash_path(dst)
        logger.sendBlobFile(args.file, basename, dst, group=logger.default_group)
    elif args.dir is not None:
        matcher = None
        skipn = args.dir_skipn
        if args.pattern is not None:
            matcher = regex.compile(args.pattern)

        uploading_list = []
        for dir, _, file_basenames in os.walk(args.dir):
            reldir = os.path.relpath(dir, args.dir)
            remote_dst = os.path.abspath(os.path.join(args.remote_dir, reldir))
            for basename in file_basenames:
                file = os.path.join(dir, basename)
                if matcher and not matcher.match(file):
                    continue
                dst =os.path.join(remote_dst, basename)
                dst = to_slash_path(dst)
                uploading_list.append((file, basename, dst))
                print(f'[{file}] to [{dst}]')
        
        with tqdm(total=len(uploading_list)) as pbar:
            uploading_list = uploading_list[skipn:]
            pbar.update(skipn)
            for file, basename, dst in uploading_list:
                pbar.set_postfix_str(f'sending [{file}] to [{dst}]')
                logger.sendBlobFile(file, basename, dst, group=logger.default_group)
                logger.wait_clear()
                pbar.update(1)
    else:
        print("do nothing")

    # wait child exit
    logger.flush()
    logger.wait()

if __name__ == "__main__":
    args = parser.parse_args()
    if args.child_mode:
        child_mode_action(args)
    else:
        parent_mode_action(args)

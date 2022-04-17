import json
from subprocess import Popen, PIPE
import sys
import os
import argparse
import asyncio
from typing import Tuple, Union, List, Dict
from aiohttp import ClientSession
from base64 import decodebytes, encodebytes


class TdLogger:
    def __init__(self, endpoint: str, default_group: str, sdata_naverage: int, credential: Union[str, Tuple[str,str]], 
                 timeout: int = 5, group_prefiex: str = ""):
        self.endpoint = endpoint
        self.default_group = default_group
        self.sdataNaverage = sdata_naverage
        self.timeout = timeout
        self.credential = credential
        self.group_prefiex = group_prefiex
        assert(self.credential != "")
        self.__start_subprocess()
        self.__data_list: Dict[str,List[dict]] = { }

    def __start_subprocess(self):
        args = [
                    sys.executable, os.path.realpath(__file__), 
                    "--endpoint", self.endpoint, 
                    "--timeout", str(self.timeout)
                ]
        if (type(self.credential) == tuple):
            args += ["--username", self.credential[0], "--password", self.credential[1]]
        else:
            args += ["--grouptoken", self.credential]
        self._subpipe = Popen(args, stdin=PIPE, text=True)

    def __gen(self, data: List[dict]):
        assert len(data) > 0
        if len(data) == 1:
            return data[0]
        dataavg = {}
        for key in data[0]:
            dataavg[key] = 0
        for d in data:
            for key in d:
                dataavg[key] += d[key]
        for key in dataavg:
            dataavg[key] /= len(data)
        return dataavg

    def debug(self, msg: str):
        self.send({"message": msg, "level": "debug"}, group=self.default_group + '-log', direct = True)

    def info(self, msg: str):
        self.send({"message": msg, "level": "info"}, group=self.default_group + '-log', direct = True)

    def warning(self, msg: str):
        self.send({"message": msg, "level": "warning"}, group=self.default_group + '-log', direct = True)

    def error(self, msg: str):
        self.send({"message": msg, "level": "error"}, group=self.default_group + '-log', direct = True)

    def send(self, data: dict, group: str = "", direct: bool = False):
        group = group if group != "" else self.default_group
        if not group in self.__data_list:
            self.__data_list[group] = []
        queue = self.__data_list[group]
        queue.append(data)
        if direct or len(queue) >= self.sdataNaverage:
            self.__sendSData(self.__gen(queue), group)
            self.__data_list[group] = []

    def flush(self):
        for group in self.__data_list:
            groupdata = self.__data_list[group]
            if len(groupdata) > 0:
                self.__sendSData(self.__gen(groupdata), group)
                self.__data_list[group] = []

    def __sendSData(self, data: dict, group: str):
        payload = json.dumps({ "data": data, "group": group })
        self.__sendmsg("sdata", payload)

    def sendBlob(self, blob: bytes, blobname: str, dst: str, group: str):
        blob_b64 = encodebytes(blob).decode("ascii")
        msg = json.dumps({
            "blobB64": blob_b64,
            "blobname": blobname,
            "destination": dst,
            "group": group,
        })
        self.__sendmsg("blob", msg)

    def __sendmsg(self, msgtype: str, payload: str):
        msg = json.dumps({"type": msgtype, "msg": payload})
        if (self._subpipe.stdin != None):
            try:
                self._subpipe.stdin.write(msg + "\n")
                self._subpipe.stdin.flush()
            except BrokenPipeError:
                self.__start_subprocess()
                self.__sendmsg(msgtype, payload)


class HttpLogger:
    def __init__(self, endpoint: str, timeout: float,
                 grouptoken: str = "",
                 username: str = "", password: str = ""):
        self.endpoint = endpoint
        self.timeout = timeout
        self.grouptoken = grouptoken
        self.username = username
        self.password = password
        self.__msg_queue = []
        self.__end = False
        self.__API_sdata = "/apis/sdata"
        self.__API_blob =  "/apis/flink"

    def getAPI(self, urlpath: str):
        if self.endpoint.endswith("/"):
            endp = self.endpoint[:-1]
            return endp + urlpath
        else:
            return self.endpoint + urlpath

    def authHeaders(self, headers: dict):
        if self.username != "":
            headers["x-username"] = self.username
            headers["x-password"] = self.password
        if self.grouptoken != "":
            headers["x-grouptoken"] = self.grouptoken

    async def postSData(self, session: ClientSession, data: str, group: str):
        body_data = { "data": data, "group": group }

        headers = { }
        self.authHeaders(headers)

        url = self.getAPI(self.__API_sdata)
        async with session.post(url, json=body_data, headers=headers, timeout=self.timeout) as resp:
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

    async def handler_blob(self, session: ClientSession, payload: str):
        obj = json.loads(payload)
        group = obj["group"]
        blobname = obj["blobname"]
        dst = obj["destination"]

        blobb64: str = obj["blobB64"]
        blobbytes = blobb64.encode()
        blob = decodebytes(blobbytes)

        fileid = await self.postBlob(session, blob, dst);
        fileurl = self.__API_blob + "/" + fileid
        await self.postSData(session, json.dumps({ "url": fileurl, "name": blobname }), group)

    async def readline(self):
        return await asyncio.get_running_loop().run_in_executor(None, sys.stdin.readline)

    async def __run_fetchmsg(self):
        while True:
            msg = await self.readline()
            if msg is None or len(msg) == 0:
                break
            self.__msg_event.set()
            msg = msg.strip()
            self.__msg_queue.append(msg)

    async def __run_dispatchmsg(self):
        while True:
            if (self.__end and len(self.__msg_queue) == 0):
                break
            if len(self.__msg_queue) == 0:
                await self.__msg_event.wait()
                self.__msg_event.clear()
            async with ClientSession() as session:
                while len(self.__msg_queue) > 0:
                    msg: str = self.__msg_queue.pop(0)
                    obj = json.loads(msg)
                    msgtype = obj["type"]
                    payload = obj["msg"]

                    try:
                        if msgtype == "blob":
                            await self.handler_blob(session, payload)
                        elif msgtype == "sdata":
                            await self.handler_sdata(session, payload)
                    except Exception as e:
                        shortmsg = msg[0:min(len(msg), 10)]
                        if len(shortmsg) < len(msg):
                            shortmsg += "..."
                        print("%s: %s, when sending [%s], timeout=%s" % (type(e).__name__, str(e), shortmsg, self.timeout))
                        break

    async def run(self):
        self.__msg_event = asyncio.Event()
        await asyncio.gather(self.__run_fetchmsg(), self.__run_dispatchmsg())


parser = argparse.ArgumentParser(description='Message Logger')
parser.add_argument('-a', '--endpoint',   type=str,   help='endpoint to post msg', required=True)
parser.add_argument('-t', '--timeout',    type=float, help='http request timeout in seconds', default=5)
parser.add_argument('-u', '--username',   type=str,   help='service username', default="")
parser.add_argument('-p', '--password',   type=str,   help='service password', default="")
parser.add_argument('-c', '--grouptoken', type=str,   help='service grouptoken', default="")

if __name__ == "__main__":
    args = parser.parse_args()
    httplogger = HttpLogger(args.endpoint, args.timeout, 
                            username=args.username, password=args.password, 
                            grouptoken=args.grouptoken)
    asyncio.run(httplogger.run())

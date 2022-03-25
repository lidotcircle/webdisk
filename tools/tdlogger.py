import json
from subprocess import Popen, PIPE
import sys
import os
import argparse
import asyncio
from typing import Tuple, Union
from aiohttp import ClientSession


class TdLogger:
    def __init__(self, api: str, group: str, naverage: int, credential: Union[str, Tuple[str,str]], timeout: int = 5):
        self.api = api
        self.group = group
        self.naverage = naverage
        self.timeout = timeout
        self.credential = credential
        assert(self.credential != "")
        self.__start_subprocess()
        self.__data_list = []

    def __start_subprocess(self):
        args = [
                    sys.executable, os.path.realpath(__file__), 
                    "--api", self.api, 
                    "--group", self.group, 
                    "--timeout", str(self.timeout)
                ]
        if (type(self.credential) == tuple):
            args += ["--username", self.credential[0], "--password", self.credential[1]]
        else:
            args += ["--grouptoken", self.credential]
        self._subpipe = Popen(args, stdin=PIPE, text=True)

    def __gen(self):
        assert len(self.__data_list) > 0
        data = self.__data_list
        self.__data_list = []
        if len(data) == 0:
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

    def send(self, data: dict):
        self.__data_list.append(data)
        if len(self.__data_list) >= self.naverage:
            self.__send(self.__gen())

    def __send(self, data: dict):
        msg: str = json.dumps(data)
        if (self._subpipe.stdin != None):
            try:
                self._subpipe.stdin.write(msg + "\n")
                self._subpipe.stdin.flush()
            except BrokenPipeError:
                self.__start_subprocess()
                self.send(data)

    def flush(self):
        if len(self.__data_list) > 0:
            self.__send(self.__gen())


class HttpLogger:
    def __init__(self, api: str, group: str, timeout: float,
                 grouptoken: str = "",
                 username: str = "", password: str = ""):
        self.api = api
        self.group = group
        self.timeout = timeout
        self.grouptoken = grouptoken
        self.username = username
        self.password = password
        self.__queue = []
        self.__end = False

    async def connect_stdin(self):
        loop = asyncio.get_event_loop()
        reader = asyncio.StreamReader()
        protocol = asyncio.StreamReaderProtocol(reader)
        await loop.connect_read_pipe(lambda: protocol, sys.stdin)
        return reader

    async def __run_fetch(self):
        reader = await self.connect_stdin()
        while True:
            msg = await reader.readline();
            self.__msg_event.set()
            msg = msg.decode().strip()
            if (reader.at_eof()):
                self.__end = True
                break
            self.__queue.append(msg)

    async def __run_send(self):
        while True:
            if (self.__end and len(self.__queue) == 0):
                break
            if len(self.__queue) == 0:
                await self.__msg_event.wait()
                self.__msg_event.clear()
            async with ClientSession() as session:
                while len(self.__queue) > 0:
                    msg = self.__queue.pop(0)
                    try:
                        body_data = { "data": msg, "group": self.group }
                        if self.username != "":
                            body_data["username"] = self.username
                            body_data["password"] = self.password
                        if self.grouptoken != "":
                            body_data["grouptoken"] = self.grouptoken

                        res = await session.post(self.api, json=body_data, timeout=self.timeout)
                        if res.status != 200:
                            print("HTTP Error: " + str(res.status), ", send ", msg, " failed")
                            break
                    except Exception as e:
                        print("err: ", e , msg)
                        break

    async def run(self):
        self.__msg_event = asyncio.Event()
        await asyncio.gather(self.__run_fetch(), self.__run_send())


parser = argparse.ArgumentParser(description='Message Logger')
parser.add_argument('-a', '--api',        type=str,   help='api to post msg', required=True)
parser.add_argument('-g', '--group',      type=str,   help='data group', required=True)
parser.add_argument('-t', '--timeout',    type=float, help='http request timeout in seconds', default=5)
parser.add_argument('-u', '--username',   type=str,   help='service username', default="")
parser.add_argument('-p', '--password',   type=str,   help='service password', default="")
parser.add_argument('-c', '--grouptoken', type=str,   help='service grouptoken', default="")

if __name__ == "__main__":
    args = parser.parse_args()
    httplogger = HttpLogger(args.api, args.group, args.timeout, 
                            username=args.username, password=args.password, 
                            grouptoken=args.grouptoken)
    asyncio.run(httplogger.run())

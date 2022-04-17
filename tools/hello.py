from tdlogger import TdLogger
import time
import random


logger = TdLogger("http://localhost:5445", "SimpleGraph", 10, ("admin", "123456"))
for i in range(50):
    random_value = random.random()
    logger.send({ "hello":  random_value + i * 0.1, "world": i * 0.1 })
    time.sleep(0.02)
logger.flush()

hexn = "0123456789abcdef"
def randomstr(length: int) -> str:
    res = ""
    for _ in range(length):
        res += hexn[random.randint(0, 15)]
    return res

for i in range(10):
    blob = randomstr(1000).encode()
    name = randomstr(10)
    logger.sendBlob(blob, name, "/kvkn/" + name, "tgroup")
    time.sleep(0.1)


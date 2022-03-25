from tdlogger import TdLogger
import time
import random


logger = TdLogger("http://localhost:5445/apis/sdata", "SimpleGraph", 10, ("admin", "123456"))
for i in range(1000):
    random_value = random.random()
    logger.send({ "hello":  random_value + i * 0.1, "world": i * 0.1 })
    time.sleep(0.1)


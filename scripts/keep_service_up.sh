#!/bin/bash

service_pid=
service_port=$(cat /etc/webdisk/config.yaml | grep '^listen_port:[[:space:]]*[[:digit:]]\+[[:space:]]*$' | head -n 1 | grep -oe '[[:digit:]]\+')
start_service() {
    node /opt/webdisk/backend/bin/main.js \
        -c /etc/webdisk/config.yaml \
        -r /opt/webdisk/dashboard &
    service_pid=$!
    echo "$(date): start service, pid=${service_pid}" >> /var/log/webdisk.log
    # TODO
    sleep 5
}

kill_service() {
    pkill -f node >> /var/log/webdisk.log
}

watch_service() {
    while (true); do
        local status_code=$(curl -s -I -m 5 http://localhost:${service_port} | head -n 1 | grep -oe '[[:digit:]]\{3\}')
        if [ "${status_code}" != "200" ]; then
            echo "$(date): get statusCode=${status_code}" >> /var/log/webdisk.log
            echo "$(date): service [http://localhost:${service_port}] is down, restart it" >> /var/log/webdisk.log
            break
        fi

        sleep 30
    done
}


while (true); do
    watch_service
    kill_service
    start_service
done

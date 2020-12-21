FROM node:12

WORKDIR /usr/webdisk
COPY ./release/webdisk/package*.json ./
RUN npm install
COPY ./release/webdisk .
COPY ./etc/webdisk /etc/webdisk/

EXPOSE 5445
CMD ["node", "/usr/webdisk/bin/main.js", "-c", "/etc/webdisk/webdisk.json"]


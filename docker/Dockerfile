
FROM node:12

WORKDIR /usr/webdisk
COPY ./release/webdisk .
RUN npm install --only=production
COPY ./etc/webdisk /etc/webdisk/

EXPOSE 5445
CMD ["node", "/usr/webdisk/bin/main.js", "-c", "/etc/webdisk/config.yaml"]


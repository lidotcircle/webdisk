FROM node:12 as builder

WORKDIR /opt/webdisk
RUN npm -g install @angular/cli@10.2.0
RUN npm install && npx gulp release


FROM node:12

WORKDIR /opt/webdisk
COPY --from=builder /opt/webdisk/release/webdisk .
RUN npm install --only=production
COPY ./etc/webdisk /etc/webdisk/

EXPOSE 5445
CMD ["node", "/usr/webdisk/bin/main.js", "-c", "/etc/webdisk/config.yaml"]


FROM node:12 as builder

WORKDIR /opt/webdisk
COPY . .
RUN npm install && cd backend && npm install && cd ../dashboard && npm install
RUN npx gulp release


FROM node:12

WORKDIR /opt/webdisk
COPY --from=builder /opt/webdisk/release .
RUN cd backend && npm install --only=production
COPY ./backend/etc/webdisk /etc/webdisk/

EXPOSE 5445
CMD ["node", "/opt/webdisk/backend/bin/main.js", "-c", "/etc/webdisk/config.yaml", "-r", "/opt/webdisk/dashboard"]

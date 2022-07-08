FROM node:16 as builder

WORKDIR /opt/webdisk
COPY . .
RUN npm install && cd backend && npm install && cd ../dashboard && npm install --force
RUN npx gulp release


FROM node:16

WORKDIR /opt/webdisk
COPY --from=builder /opt/webdisk/release .
RUN cd backend && npm install --only=production
COPY ./backend/etc/webdisk /etc/webdisk/
COPY ./scripts /opt/webdisk/scripts/

EXPOSE 5445
CMD ["/opt/webdisk/scripts/keep_service_up.sh"]

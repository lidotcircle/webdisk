--------
WEBDISK

---
Build

+ checkout submodule
+ run `npm install`
+ run `tsc gulp*.ts`
+ run `gulp release` and again

---
Nginx

An example
`
location / {
    proxy_pass http://localhost:5445/;
}

location /ws {
    proxy_pass http://localhost:5445;
    proxy_http_version  1.1;
    proxy_set_header    Upgrade $http_upgrade;
    proxy_set_header    Connection "upgrade";
    proxy_set_header    Host $http_host;
    proxy_set_header    X-Real-IP $remote_addr;
}
`

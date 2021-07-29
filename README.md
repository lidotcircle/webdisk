## WEBDISK


### Deployment with Docker

+ use docker compose, just run `docker-compose up` in project root directory
+ use docker image, pull image with `docker pull whatyoudo/webdisk:<version>`


### Build

Install Angular
```bash
$ npm -g install @angular/cli@10.2.0
```

Install NPM Dependencies
```bash
$ npm install && \
        pushd dashboard && \
        npm install && \
        popd
```

Build
```bash
$ npm run build
```


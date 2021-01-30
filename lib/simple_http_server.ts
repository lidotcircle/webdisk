import * as http  from 'http';
import * as event from 'events';
import * as assert from 'assert';
import { URL } from 'url';
import { cons } from './utils';
import { error, info } from './logger';
import { HttpClientError, HttpRedirection, HttpServerError, HttpUnexpected } from './errors';

const AsUrlMap = Symbol('http server url');
/**
 * url match rule:
 *                            using regex
 * '/.*'                      match urls start with '/'
 * '/'                        only match '/'
 * '/prefix/:id'              will expand to '/prefix/([^/]+)'
 *                            match urls such as '/prefix/alice', but not match '/prefix/alice/uu'
 * '/prefix/:id/:operation'   will expand to '/prefix/([^/]+)/([^/]+)'
 *                            match urls such as '/prefix/alice/hello' and {id: 'alice', operation: 'hello'}
 * if more than two rule match url, using the one with highest priority
 * priority = length of rule + (number of :op) * 10000
 */
export function simpleURL(url: string) {
    return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const originFunction: Function = descriptor.value;
        target[AsUrlMap] = target[AsUrlMap] || {};
        const map: {[key: string]: string} = target[AsUrlMap];

        if(map[url] != null) {
            throw new Error('bad bad url entry');
        }
        map[url] = propertyName;
    }
}

function urlpriority(url: string): number {
    let ans = url.length;
    const idmatch = new RegExp('\/:[^/]+');
    while(url != null && url.match(idmatch)) {
        ans += 10000;
        const m = url.match(idmatch);
        url = url.substr(m.index + m[0].length);
    }
    return ans;
}

function matchurl(url: string, pathname: string): any {
    const idmatch = new RegExp('\/:([^/]+)');
    const keys = [];
    while(idmatch.test(url)) {
        const m = url.match(idmatch);
        keys.push(m[1]);
        url = url.substr(0, m.index) + '/([^/]+)' + url.substr(m.index + m[0].length);
    }
    const umatcher = new RegExp('^' + url + '$');
    const um = pathname.match(umatcher);
    if(um == null) {
        return null;
    } else {
        let ans = {};

        for(const ki in keys) {
            const k = keys[ki];
            ans[k] = um[parseInt(ki) + 1];
        }

        return ans;
    }
}

/**
 * @class SimpleHttpServer delegate of underlying http server
 * @event upgrade
 * @event listening
 * @event close
 * @event error
 */
export class SimpleHttpServer extends event.EventEmitter //{
{
    private httpServer: http.Server;

    constructor () //{
    {
        super();
        this.httpServer = new http.Server();

        this.httpServer.on("upgrade", (inc, sock, buf) => this.emit("upgrade", inc, sock, buf));
        this.httpServer.on("close", ()  => this.emit("close"));
        this.httpServer.on("error", err => this.emit("error", err));
        this.httpServer.on("listening", () => this.emit("listening"));

        this.httpServer.on("request", this.onrequest.bind(this));
    } //}

    /** default listener of request event */
    protected async onrequest(request: http.IncomingMessage, response: http.ServerResponse) //{
    {
        response.setHeader("Server", cons.ServerName);
        let url = new URL(request.url, `http:\/\/${request.headers.host}`);
        if (!request.method.toLowerCase().match(/get|head|post|put|delete|patch/)) {
            response.statusCode = 405;
            response.setHeader("Connection", "close");
            response.end();
        }

        const urlmap = this[AsUrlMap] as {[key: string]: string};
        let matcher = {
            priority: 0,
            params: {},
            urlmatcher: null
        };
        for(const k in urlmap) {
            const params = matchurl(k, url.pathname);
            if(params != null) {
                const p = urlpriority(k);
                if(p > matcher.priority) {
                    matcher = {
                        priority: p,
                        params: params,
                        urlmatcher: k
                    }
                }
            }
        }

        if(matcher.urlmatcher == null) {
            response.statusCode = 404;
            info(`match url '${url.pathname}' fail`);
            response.end();
        } else {
            const method = urlmap[matcher.urlmatcher];
            try {
                const ans = (this[method] as Function).bind(this)(request, url, response, matcher.params);
                if(ans instanceof Promise) {
                    await ans;
                }
            } catch (err) {
                console.error(err);
                error(err.message);

                if(err instanceof HttpUnexpected) {
                    try {
                    if(err instanceof HttpClientError || 
                       err instanceof HttpServerError) 
                    {
                        response.statusCode = err.code;
                        response.end();
                    } else  {
                        assert.equal(err instanceof HttpRedirection, true);
                        const redirection = err as HttpRedirection;
                        let location = '';
                        for(const url of redirection.urls) {
                            location += (url + ',')
                        }
                        assert.equal(location.length > 0, true);
                        location = location.substr(0, location.length - 1);
                        response.statusCode = redirection.code;
                        response.setHeader('Location', location);
                        response.end();
                    }
                    return;
                    } catch (e) {err = e;}
                }

                {
                    response.statusCode = 500;
                    response.end(`<h1>Internal Server Error ${err.message}</h1>`);
                }
            }
        }
    } //}

    /** listen */
    public listen(port: number, addr: string) //{
    {
        this.httpServer.listen(port, addr);
    } //}
} //}


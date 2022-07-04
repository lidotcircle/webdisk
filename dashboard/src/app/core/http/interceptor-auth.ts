import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpEvent, HttpRequest, HttpHandler } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { AuthService } from 'src/app/service/auth';
import { catchError, concatMap, take } from 'rxjs/operators';

@Injectable()
export class InterceptorAuth implements HttpInterceptor {
    constructor(private auth: AuthService) {
    }

    intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return from(this.auth.jwtTokenAsync()).pipe(
            catchError(_ => of(null)),
            take(1),
            concatMap(token => {
            const handle = (token ?
                next.handle(httpRequest.clone({setHeaders: {"x-access-token": token}})) :
                next.handle(httpRequest));
            return handle
        }));
    }
}


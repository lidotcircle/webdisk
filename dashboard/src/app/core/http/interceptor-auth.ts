import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpEvent, HttpRequest, HttpHandler } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/service/auth';

@Injectable()
export class InterceptorAuth implements HttpInterceptor {
    constructor(private auth: AuthService) {
    }

    intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.auth.jwtToken;

        if(token) {
            return next.handle(httpRequest.clone({setHeaders: {"x-access-token": token}}));
        } else {
            return next.handle(httpRequest);
        }
    }
}


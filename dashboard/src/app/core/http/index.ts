import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { InterceptorAuth } from './interceptor-auth';
import { InterceptorExceptionRedirect } from './interceptor-exception-page';

export const InterceptorProviders = [
    {provide: HTTP_INTERCEPTORS, useClass: InterceptorAuth, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: InterceptorExceptionRedirect, multi: true},
];


import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'ngx-exception-403',
    template: `<ngx-exception description='无权限进行操作' statusCode='403' statusText='Forbidden'></ngx-exception>`,
})
export class Exception403Component {
    constructor() {}
}


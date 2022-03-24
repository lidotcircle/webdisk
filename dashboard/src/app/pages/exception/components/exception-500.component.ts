import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'ngx-exception-500',
    template: `<ngx-exception description='服务器内部错误' statusCode='500' statusText='Server Internal Error'></ngx-exception>`,
})
export class Exception500Component {
    constructor() {}
}


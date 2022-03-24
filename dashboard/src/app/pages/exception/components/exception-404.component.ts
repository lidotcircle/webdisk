import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'ngx-exception-404',
    template: `<ngx-exception description='找不到页面' statusCode='404' statusText='Not Found'></ngx-exception>`,
})
export class Exception404Component {
    constructor() {}
}


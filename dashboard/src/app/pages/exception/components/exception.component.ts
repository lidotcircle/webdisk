import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'ngx-exception',
    styles: [`
    .flex-centered {
      margin: auto;
    }

    nb-card {
      min-height: 70vh;
    }

    nb-card-body {
      display: flex;
    }

    .title {
      text-align: center;
    }

    .sub-title {
      text-align: center;
      display: block;
      margin-bottom: 3rem;
    }

    .home-button {
      margin-bottom: 2rem;
    }`],
    template: `
    <div class="row">
      <div class="col-md-12">
        <nb-card accent="danger">
          <nb-card-body>
            <div class="flex-centered col-xl-4 col-lg-6 col-md-8 col-sm-12">
              <h2 class="title">{{ statusCode }} {{ statusText }}</h2>
              <small class="sub-title">{{ description }}</small>
              <button nbButton fullWidth (click)="goToHome()" type="button" class="home-button">
                返回首页
              </button>
            </div>
          </nb-card-body>
        </nb-card>
      </div>
    </div>
    `,
})
export class ExceptionComponent {
    @Input()
    description: String = 'Exception';
    @Input()
    statusCode: number = 400;
    @Input()
    statusText: String = 'Bad Request';

    constructor(private router: Router) {}

    goToHome() {
        this.router.navigate(['/daoyun']);
    }
}


import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/service/auth';


/** dashboard pages guard */
@Injectable({
    providedIn: 'root'
})
export class DashboardDomainGuard implements CanActivate {
    constructor(private authService: AuthService,
                private router: Router) {}

    canActivate(
        _next: ActivatedRouteSnapshot,
        _state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree 
    {
        return new Promise((resolve) => {
            const m = async (): Promise<boolean> => {
                if(!this.authService.isLogin) {
                    this.router.navigateByUrl('/wd');
                    return false;
                } else {
                    if(this.authService.jwtToken == null) {
                        await this.authService.refreshJWT();
                    }

                    return true;
                }
            };

            m().then(resolve).catch(() => {
                this.router.navigateByUrl('/daoyun');
                resolve(false);
            });
        });
    }
}


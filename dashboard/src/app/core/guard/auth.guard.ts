import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/service/auth';


/** password pages guard */
@Injectable({
    providedIn: 'root'
})
export class AuthDomainGuard implements CanActivate {
    constructor(private authService: AuthService,
                private router: Router) {}

    canActivate(
        _: ActivatedRouteSnapshot,
        __: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree 
    {
        return new Promise((resolve) => {
            const m = async (): Promise<boolean> => {
                if(this.authService.isLogin) {
                    if(this.authService.jwtToken == null) {
                        await this.authService.refreshJWT();
                    }

                    this.router.navigateByUrl('/wd/dashboard');
                    return false;
                } else {
                    return true;
                }
            };

            m().then(resolve).catch(() => resolve(true));
        });
    }

}


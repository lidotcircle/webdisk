import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AccountManagerService } from '../shared/service/account-manager.service';
import { nextTick } from '../shared/utils';

@Injectable({
    providedIn: 'root'
})
export class HomeGuard implements CanActivate {
    constructor(private accountManager: AccountManagerService,
                private router: Router) {}

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
            return new Promise((resolve, _) => {
                this.accountManager.getUserinfo().then( info => {
                    const ans = !!info;
                    if(!ans) nextTick(() => this.router.navigateByUrl('/'));
                    resolve(ans);
                });
            });
        }
}


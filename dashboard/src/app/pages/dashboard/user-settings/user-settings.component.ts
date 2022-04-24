import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swiper from 'swiper';
import { SwiperComponent } from 'swiper/angular';
import SwiperCore, {EffectFade, EffectCube, EffectCoverflow, EffectFlip} from 'swiper/core';

SwiperCore.use([EffectFade, EffectCube, EffectCoverflow, EffectFlip]);

@Component({
    selector: 'app-user-settings',
    templateUrl: './user-settings.component.html',
    styleUrls: ['./user-settings.component.scss']
})
export class UserSettingsComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('swiper', {static: true})
    private settings: SwiperComponent;

    @ViewChild('settingsnav', {static: true})
    private nav: ElementRef;

    swiperDirection: string;
    private query_panel: string;
    private getPanelName(n: number) {
        const container = this.nav.nativeElement as HTMLElement;
        const child = container.children[n];
        if (!child) return null;
        return (child as HTMLElement).dataset.panel;
    }
    private gotoPanelText(swiper: Swiper, panel: string, speedMS: number) {
        if (!swiper)
            return;

        const container = this.nav.nativeElement as HTMLElement;
        for (let i=0;i<container.children.length;i++) {
            const child = container.children[i] as HTMLElement;
            if (panel == child.dataset.panel) {
                swiper.slideTo(i, speedMS);
                break;
            }
        }
    }

    constructor(private activatedRoute: ActivatedRoute,
                private router: Router) {
        this.swiperDirection = window.innerWidth <= 600 ? 'horizontal' : 'vertical';
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.settings.swiperRef.update(), 0);
    }

    private resizeSubscription: Subscription;
    ngOnInit(): void {
        const resizeHandler = () => {
            this.swiperDirection = window.innerWidth <= 600 ? 'horizontal' : 'vertical';
            // TODO update swiper after resize, otherwise incorrect direction
        }
        window.addEventListener("resize", resizeHandler);
        this.resizeSubscription = new Subscription(() => window.removeEventListener("resize", resizeHandler));

        this.activatedRoute.queryParamMap.subscribe(params => {
            const panel = params.get("panel");
            if (panel) {
                this.gotoPanelText(this.settings.swiperRef, panel, 500);
                this.query_panel = panel;
            } else {
                const n1 = this.getPanelName(0);
                if (n1) this.gotoPanelText(this.settings.swiperRef, n1, 500);
            }
        });
    }

    ngOnDestroy(): void {
        this.resizeSubscription.unsubscribe();
    }

    onSlideInit(swiper: Swiper) {
        swiper.allowTouchMove = false;
        this.onSlideChange(swiper);
        if (this.query_panel)
            this.gotoPanelText(swiper, this.query_panel, 0);
    }

    onSlideChange(swiper: Swiper) {
        const prev = swiper.previousIndex;
        const curr = swiper.activeIndex;
        const nav  = this.nav.nativeElement as HTMLElement;
        if(prev != null) {
            nav.children[prev].classList.remove('active');
        }
        nav.children[curr].classList.add('active');
    }

    gotoPanel(event: MouseEvent) {
        const nav = this.nav.nativeElement as HTMLElement;

        let n = this.settings.swiperRef.activeIndex;
        for(let i=0;i<nav.children.length;i++) {
            let u = event.target as Node;
            while(u != nav) {
                if(u == nav.children[i]) {
                    n = i;
                    break;
                }
                u = u.parentNode;
            }
        }

        if(n == this.settings.swiperRef.activeIndex) return;
        this.settings.swiperRef.slideTo(n);
        const name = this.getPanelName(n);
        if (name != null) {
            this.router.navigate([], {
                queryParams: {
                    panel: name
                },
                relativeTo: this.activatedRoute,
            });
        }
    }
}


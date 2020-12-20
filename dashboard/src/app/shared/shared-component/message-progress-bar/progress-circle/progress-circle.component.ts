import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-progress-circle',
    templateUrl: './progress-circle.component.html',
    styleUrls: ['./progress-circle.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ProgressCircleComponent implements OnInit, OnDestroy {
    @Input()
    private speed: number = 360;

    private angle: number;
    private rotation: number;
    private r1: number = 50;
    private r2: number = 35;
    private qqq(r: number, theta: number): [number, number] {
        let x = 50 + r*Math.sin(theta * Math.PI / 180);
        let y = 50 - r*Math.cos(theta * Math.PI / 180);
        return [x, y];
    }
    private get p1(): [number, number] {return this.qqq(this.r1, this.rotation);}
    private get p2(): [number, number] {return this.qqq(this.r2, this.rotation);}
    private get q1(): [number, number] {return this.qqq(this.r1, this.rotation - this.angle);}
    private get q2(): [number, number] {return this.qqq(this.r2, this.rotation - this.angle);}

    get d(): string {
        const r1 = this.r1;
        const r2 = this.r2;
        const p1 = this.p1;
        const p2 = this.p2;
        const q1 = this.q1;
        const q2 = this.q2;
        const large = this.angle > 180 ? 1 : 0;
        let ans = `
        M ${p1[0]} ${p1[1]}
        A ${r1} ${r1} 0 ${large} 0 ${q1[0]} ${q1[1]}
        L ${q2[0]} ${q2[1]}
        A ${r2} ${r2} 0 ${large} 1 ${p2[0]} ${p2[1]}
        Z`;
        return ans;
    }

    private stoped = false;
    constructor() {}

    ngOnInit(): void {
        this.angle = 90;
        this.rotation = 0;
        const fps = 60;
        const T = 360 / this.speed * 1000;
        const theta = (330 - 90) / 360;

        const update = () => {
            if(this.stoped) return;

            this.rotation += 360 * ((1000 / fps) / T);
            this.rotation %= 720;

            if(this.rotation <= 360) {
                this.angle = this.rotation * theta + 90;
            } else {
                this.angle = 720 * theta - theta * this.rotation + 90;
            }
            setTimeout(() => update(), 1000 / fps);
        }

        update();
    }

    ngOnDestroy(): void {
        this.stoped = true;
    }

    finish() {
        this.stoped = true;
        this.angle = 359.9;
        this.rotation = 0;
    }

    stop() {
        this.stoped = true;
    }
}


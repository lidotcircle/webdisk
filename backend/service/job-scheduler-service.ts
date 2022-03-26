import { Injectable } from '../lib/di';


type JobType = () => Promise<void>;
class JobDetail {
    job: JobType;
    once: boolean;
    interval_ms: number;
    next_run_at: number;
}

@Injectable({
    lazy: true,
})
export class JobSchedulerService {
    private jobQueue: JobDetail[] = [];
    private next_check_at: number = 0;
    private timeout_handle: any;
    private in_checking = false;

    constructor() {
    }

    public schedule(job: JobType, interval_ms: number, once: boolean = false): void {
        const next_run_at = Date.now() + interval_ms;
        const jobDetail: JobDetail = {
            job: job,
            once: once,
            interval_ms: interval_ms,
            next_run_at: next_run_at,
        };
        this.jobQueue.push(jobDetail);
        if (!this.timeout_handle || this.next_check_at > next_run_at)
        {
            this.next_check_at = next_run_at;
            if (this.timeout_handle)
                clearTimeout(this.timeout_handle);
            this.timeout_handle = setTimeout(async () => await this.check_job(), interval_ms);
        }
    }

    private sort_job_queue(): void {
        this.jobQueue.sort((a, b) => a.next_run_at - b.next_run_at);
    }

    private async check_job(): Promise<void> {
        clearTimeout(this.timeout_handle);
        this.timeout_handle = null;
        if (this.in_checking)
            return;
        this.in_checking = true;

        for(;this.jobQueue.length > 0;) {
            this.sort_job_queue();
            const jobDetail = this.jobQueue[0];
            if (jobDetail.next_run_at > Date.now())
                break;
            this.jobQueue.shift();
            try  {
                await jobDetail.job();
            } catch (e) {
                console.error("job error: ", e);
            }
            if (!jobDetail.once) {
                jobDetail.next_run_at = Date.now() + jobDetail.interval_ms;
                this.jobQueue.push(jobDetail);
            }
        }

        if (this.jobQueue.length > 0) {
            this.sort_job_queue();
            const jobDetail = this.jobQueue[0];
            this.next_check_at = jobDetail.next_run_at;
            this.timeout_handle = setTimeout(async () => await this.check_job(), jobDetail.next_run_at - Date.now());
        }
    }
}

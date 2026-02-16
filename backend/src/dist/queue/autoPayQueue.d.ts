import Bull from 'bull';
export interface AutoPayJobData {
    subscriptionId: string;
    userAddress: string;
    amount: number;
    recipientAddress: string;
    serviceName: string;
}
declare function getQueue(): Bull.Queue<AutoPayJobData>;
/**
 * Add auto-pay job to queue
 */
export declare function addAutoPayJob(data: AutoPayJobData): Promise<Bull.Job<AutoPayJobData>>;
/**
 * Get job by ID
 */
export declare function getAutoPayJobById(jobId: string): Promise<Bull.Job<AutoPayJobData> | null>;
/**
 * Get job status
 */
export declare function getAutoPayJobStatus(jobId: string): Promise<{
    status: string;
    progress?: number;
    result?: any;
    error?: string;
    attemptsMade?: number;
    data?: AutoPayJobData;
}>;
/**
 * Get all jobs for a subscription
 */
export declare function getJobsForSubscription(subscriptionId: string): Promise<Bull.Job<AutoPayJobData>[]>;
/**
 * Check if queue is available
 */
export declare function isQueueAvailable(): boolean;
export { getQueue as autoPayQueue };
export default getQueue;
//# sourceMappingURL=autoPayQueue.d.ts.map
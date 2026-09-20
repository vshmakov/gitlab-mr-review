import * as crypto from 'crypto';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';

export class ReviewedFilesStore {
    private readonly _cache = new Map<string, Map<string, string>>();

    private key(mergeRequest: GitLabMergeRequest): string {
        return `${mergeRequest.project_id}:${mergeRequest.iid}`;
    }

    private static diffHash(file: GitLabMergeRequestFile): string {
        return crypto.createHash('md5').update(file.diff).digest('hex');
    }

    public isReviewed(
        mergeRequest: GitLabMergeRequest,
        file: GitLabMergeRequestFile,
    ): boolean {
        const mrKey = this.key(mergeRequest);
        const files = this._cache.get(mrKey);
        if (!files) {return false;}

        const savedHash = files.get(file.path);
        if (!savedHash) {return false;}

        return savedHash === ReviewedFilesStore.diffHash(file);
    }

    public markAsReviewed(
        mergeRequest: GitLabMergeRequest,
        file: GitLabMergeRequestFile,
    ): void {
        const mrKey = this.key(mergeRequest);
        let files = this._cache.get(mrKey);
        if (!files) {
            files = new Map();
            this._cache.set(mrKey, files);
        }
        files.set(file.path, ReviewedFilesStore.diffHash(file));
    }

    public unmarkAsReviewed(
        mergeRequest: GitLabMergeRequest,
        file: GitLabMergeRequestFile,
    ): void {
        const mrKey = this.key(mergeRequest);
        const files = this._cache.get(mrKey);
        if (files) {
            files.delete(file.path);
        }
    }

    public getReviewedFiles(
        mergeRequest: GitLabMergeRequest,
        allFiles: GitLabMergeRequestFile[],
    ): GitLabMergeRequestFile[] {
        return allFiles.filter((f) => this.isReviewed(mergeRequest, f));
    }

    public getUnreviewedFiles(
        mergeRequest: GitLabMergeRequest,
        allFiles: GitLabMergeRequestFile[],
    ): GitLabMergeRequestFile[] {
        return allFiles.filter((f) => !this.isReviewed(mergeRequest, f));
    }

    public getSnapshot(): Record<string, Record<string, string>> {
        const result: Record<string, Record<string, string>> = {};
        for (const [mrKey, files] of this._cache.entries()) {
            result[mrKey] = Object.fromEntries(files);
        }
        return result;
    }

    public restoreSnapshot(
        snapshot: Record<string, Record<string, string>>,
    ): void {
        for (const [mrKey, files] of Object.entries(snapshot)) {
            this._cache.set(mrKey, new Map(Object.entries(files)));
        }
    }

    public refresh(): void {
        this._cache.clear();
    }
}
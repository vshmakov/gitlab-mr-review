import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import {
	GitLabMergeRequestDiffResponse,
	GitLabMergeRequestFile,
} from '../model/GitLabMergeRequestFile';

const DEFAULT_PER_PAGE = 100;

export function createMergeRequestDiffsPath(
	mergeRequest: GitLabMergeRequest,
): string {
	const query = new URLSearchParams({
		per_page: DEFAULT_PER_PAGE.toString(),
	}).toString();

	return (
		`/api/v4/projects/` +
		`${mergeRequest.project_id}/` +
		`merge_requests/${mergeRequest.iid}/diffs?${query}`
	);
}

export function mapMergeRequestFile(
	diff: GitLabMergeRequestDiffResponse,
): GitLabMergeRequestFile {
	return {
		path: diff.deleted_file
			? diff.old_path
			: diff.new_path,
		oldPath: diff.old_path,
		newPath: diff.new_path,
		diff: diff.diff,
		added: diff.new_file,
		deleted: diff.deleted_file,
		renamed: diff.renamed_file,
	};
}
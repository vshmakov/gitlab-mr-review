import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';

export interface DiffCommentData {
	text: string;
	documentLine: number;
	oldLine?: number;
	newLine?: number;
	mergeRequest: GitLabMergeRequest;
	file: GitLabMergeRequestFile;
}

export class GitLabCommentService {
	public async handleComment(data: DiffCommentData): Promise<void> {
		console.log('[CommentService] comment received:', {
			text: data.text,
			documentLine: data.documentLine,
			oldLine: data.oldLine,
			newLine: data.newLine,
			file: data.file.path,
			mr: `!${data.mergeRequest.iid}`,
		});
	}
}
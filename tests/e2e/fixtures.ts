import { GitLabMergeRequest } from '../../src/domain/model/GitLabMergeRequest';

export const TEST_USER = { id: 1, username: 'testuser', name: 'Test User', state: 'active' };
export const TEST_BASE_URL = 'https://gitlab.example.com';
export const TEST_TOKEN = 'test-token-123';

export function createMr(overrides?: Partial<GitLabMergeRequest>): GitLabMergeRequest {
	return {
		id: 100,
		iid: 42,
		project_id: 10,
		project_path: 'group/project',
		title: 'Fix bug',
		web_url: `${TEST_BASE_URL}/group/project/-/merge_requests/42`,
		updated_at: '2024-01-02T00:00:00.000Z',
		draft: false,
		work_in_progress: false,
		author: { name: 'Author', username: 'author' },
		...overrides,
	};
}
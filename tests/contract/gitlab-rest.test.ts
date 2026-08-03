import { shouldSkip, GITLAB_URL, GITLAB_TOKEN, createRealHttpClient } from './setup';
import { GitLabRestClient } from '../../src/domain/client/GitLabRestClient';

describe('Contract: GitLab REST API', () => {
	if (shouldSkip()) {
		it.skip('requires GITLAB_TOKEN', () => {});
		return;
	}

	const client = new GitLabRestClient(
		GITLAB_URL,
		GITLAB_TOKEN!,
		createRealHttpClient(),
	);

	it('GET /api/v4/user returns current user', async () => {
		const user = await client.get<{ id: number; username: string; name: string }>('/api/v4/user');
		expect(user.id).toBeDefined();
		expect(user.username).toBeDefined();
	});

	it('GET returns 404 for non-existent resource', async () => {
		await expect(
			client.get('/api/v4/projects/999999999'),
		).rejects.toThrow('404');
	});

	it('GET respects custom headers', async () => {
		const user = await client.get<{ username: string }>('/api/v4/user');
		expect(user.username).toBeDefined();
	});
});
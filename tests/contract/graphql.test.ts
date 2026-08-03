import { shouldSkip, GITLAB_URL, GITLAB_TOKEN, createRealHttpClient } from './setup';
import { GitLabGraphQLClient } from '../../src/domain/client/GitLabGraphQLClient';

describe('Contract: GitLabGraphQLClient', () => {
	if (shouldSkip()) {
		it.skip('requires GITLAB_TOKEN', () => {});
		return;
	}

	const client = new GitLabGraphQLClient(
		GITLAB_URL,
		GITLAB_TOKEN!,
		createRealHttpClient(),
	);

	it('request returns data for a valid query', async () => {
		const data = await client.request<{
			currentUser: {
				id: string;
				username: string;
				name: string;
			};
		}>(`
			query {
				currentUser {
					id
					username
					name
				}
			}
		`);

		expect(data.currentUser.id).toBeDefined();
		expect(data.currentUser.username).toBeDefined();
		expect(data.currentUser.name).toBeDefined();
	});

	it('throws on invalid query', async () => {
		await expect(
			client.request(`
				query {
					nonExistentField
				}
			`),
		).rejects.toThrow();
	});
});
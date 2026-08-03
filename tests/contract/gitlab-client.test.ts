import { shouldSkip, GITLAB_URL, GITLAB_TOKEN, createRealHttpClient } from './setup';
import { GitLabClientFactory } from '../../src/domain/client/GitLabClientFactory';
import { MockSecretStorage, MockConfiguration, MockNotifier, MockInput, MockCommandRegistry } from '../e2e/mocks/mock-environment';

describe('Contract: GitLabClient (read-only)', () => {
	if (shouldSkip()) {
		it.skip('requires GITLAB_TOKEN', () => {});
		return;
	}

	const http = createRealHttpClient();
	const secrets = new MockSecretStorage();
	const config = new MockConfiguration();
	const notifier = new MockNotifier();
	const input = new MockInput();
	const commands = new MockCommandRegistry();

	let factory: GitLabClientFactory;
	let client: Awaited<ReturnType<GitLabClientFactory['create']>>;

	beforeAll(async () => {
		factory = new GitLabClientFactory(secrets, config, notifier, input, commands, http);
		await factory.setCredentials(GITLAB_URL, GITLAB_TOKEN!);
		client = await factory.create();
	});

	it('getCurrentUser returns authenticated user', async () => {
		const user = await client!.getCurrentUser();
		expect(user.username).toBeDefined();
		expect(user.name).toBeDefined();
	});

	it('getMergeRequestsForReviewer returns array', async () => {
		const user = await client!.getCurrentUser();
		const mrs = await client!.getMergeRequestsForReviewer(user.id);
		expect(Array.isArray(mrs)).toBe(true);
	});

	it('getMyMergeRequests returns array', async () => {
		const mrs = await client!.getMyMergeRequests();
		expect(Array.isArray(mrs)).toBe(true);
	});

	it('getPendingReviews returns array', async () => {
		const mrs = await client!.getPendingReviews();
		expect(Array.isArray(mrs)).toBe(true);
	});

	it('getApprovedReviews returns array', async () => {
		const mrs = await client!.getApprovedReviews();
		expect(Array.isArray(mrs)).toBe(true);
	});

	it('getRequestedChangesReviews returns array', async () => {
		const mrs = await client!.getRequestedChangesReviews();
		expect(Array.isArray(mrs)).toBe(true);
	});

	it('getMissedReviews returns array', async () => {
		const mrs = await client!.getMissedReviews();
		expect(Array.isArray(mrs)).toBe(true);
	});
});
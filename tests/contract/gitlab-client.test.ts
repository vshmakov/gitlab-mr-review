import { shouldSkip, GITLAB_URL, GITLAB_TOKEN, createRealHttpClient } from './setup';
import { GitLabClientFactory } from '../../src/domain/client/GitLabClientFactory';
import { MockSecretStorage, MockConfiguration, MockNotifier, MockInput, MockCommandRegistry } from '../e2e/mocks/mock-environment';

function assertMr(mr: any) {
	expect(mr.id).toBeDefined();
	expect(mr.iid).toBeDefined();
	expect(mr.project_id).toBeDefined();
	expect(mr.title).toBeDefined();
	expect(mr.web_url).toBeDefined();
	expect(mr.updated_at).toBeDefined();
}

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

	it('getCurrentUser returns user with required fields', async () => {
		const user = await client!.getCurrentUser();
		expect(user.id).toBeDefined();
		expect(user.username).toBeDefined();
		expect(user.name).toBeDefined();
	});

	it('getMergeRequestsForReviewer returns MRs with required fields', async () => {
		const user = await client!.getCurrentUser();
		const mrs = await client!.getMergeRequestsForReviewer(user.id);
		expect(Array.isArray(mrs)).toBe(true);
		for (const mr of mrs) {
			assertMr(mr);
		}
	});

	it('getMyMergeRequests returns MRs with required fields', async () => {
		const mrs = await client!.getMyMergeRequests();
		expect(Array.isArray(mrs)).toBe(true);
		for (const mr of mrs) {
			assertMr(mr);
		}
	});

	it('getPendingReviews returns MRs with required fields', async () => {
		const mrs = await client!.getPendingReviews();
		expect(Array.isArray(mrs)).toBe(true);
		for (const mr of mrs) {
			assertMr(mr);
			expect(mr.project_path).toBeDefined();
		}
	});

	it('getApprovedReviews returns MRs with required fields', async () => {
		const mrs = await client!.getApprovedReviews();
		expect(Array.isArray(mrs)).toBe(true);
		for (const mr of mrs) {
			assertMr(mr);
		}
	});

	it('getRequestedChangesReviews returns MRs with required fields', async () => {
		const mrs = await client!.getRequestedChangesReviews();
		expect(Array.isArray(mrs)).toBe(true);
		for (const mr of mrs) {
			assertMr(mr);
		}
	});

	it('getMissedReviews returns MRs with required fields', async () => {
		const mrs = await client!.getMissedReviews();
		expect(Array.isArray(mrs)).toBe(true);
		for (const mr of mrs) {
			assertMr(mr);
		}
	});
});
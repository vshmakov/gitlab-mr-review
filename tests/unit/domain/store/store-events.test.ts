import { MergeRequestsStore } from '../../../../src/domain/store/MergeRequestsStore';

function createMocks(): any {
	const client = {
		getPendingReviews: jest.fn(),
		getApprovedReviews: jest.fn(),
		getRequestedChangesReviews: jest.fn(),
		getMissedReviews: jest.fn(),
		getMyMergeRequests: jest.fn(),
		getApprovalData: jest.fn(),
		getMergeRequestFiles: jest.fn(),
	};
	const clientFactory = {
		create: jest.fn(() => client),
		clear: jest.fn(),
	};
	const notifier = {
		showError: jest.fn(),
		showInfo: jest.fn(),
		showWarning: jest.fn(),
	};
	const progress = { withProgress: jest.fn(async (fn) => fn()) };
	return { client, clientFactory, notifier, progress };
}

describe('MergeRequestsStore events', () => {
	it('emits category event on load start', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getPendingReviews.mockResolvedValue([]);
		const store = new MergeRequestsStore(clientFactory, notifier);
		const changes: any[] = [];
		store.onDidChange((change) => changes.push(change));

		await store.loadPending();

		expect(changes.some(c => c.type === 'category' && c.category === 'needsReview')).toBe(true);
	});

	it('emits category event on load end', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getPendingReviews.mockResolvedValue([]);
		const store = new MergeRequestsStore(clientFactory, notifier);
		const changes: any[] = [];
		store.onDidChange((change) => changes.push(change));

		await store.loadPending();

		const categoryChanges = changes.filter(c => c.type === 'category');
		expect(categoryChanges).toHaveLength(2);
	});

	it('emits mergeRequest event on approval load', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getApprovalData.mockResolvedValue({ approvedBy: [], requestedChanges: [] });
		const store = new MergeRequestsStore(clientFactory, notifier);
		const changes: any[] = [];
		store.onDidChange((change) => changes.push(change));
		const mr = { project_id: 10, iid: 42, id: 1 };

		await store.loadApprovalData(mr as any);

		expect(changes.some(c => c.type === 'mergeRequest')).toBe(true);
	});

	it('emits mergeRequest event on files load', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getMergeRequestFiles.mockResolvedValue([]);
		const store = new MergeRequestsStore(clientFactory, notifier);
		const changes: any[] = [];
		store.onDidChange((change) => changes.push(change));
		const mr = { project_id: 10, iid: 42 };

		await store.loadFiles(mr as any);

		expect(changes.some(c => c.type === 'mergeRequest')).toBe(true);
	});

	it('emits refresh event on refresh', () => {
		const { clientFactory, notifier } = createMocks();
		const store = new MergeRequestsStore(clientFactory, notifier);
		const changes: any[] = [];
		store.onDidChange((change) => changes.push(change));

		store.refresh();

		expect(changes.some(c => c.type === 'refresh')).toBe(true);
	});
});
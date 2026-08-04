import { MergeRequestsStore } from '../../src/domain/store/MergeRequestsStore';

function createMocks() {
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
	const notifier = { showError: jest.fn() };
	const progress = { withProgress: jest.fn(async (fn) => fn()) };
	return { client, clientFactory, notifier, progress };
}

describe('MergeRequestsStore', () => {
	it('isCategoryLoading reflects loading state', async () => {
		const { client, clientFactory, notifier } = createMocks();
		const loadingStates: boolean[] = [];
		client.getPendingReviews.mockImplementation(async () => {
			return [];
		});
		const store = new MergeRequestsStore(clientFactory, notifier);

		store.onDidChange(() => {
			loadingStates.push(store.isCategoryLoading('needsReview'));
		});

		await store.loadPending();

		expect(loadingStates).toContain(true);
		expect(store.isCategoryLoading('needsReview')).toBe(false);
	});

	it('isCategoryLoaded reflects loaded state', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getPendingReviews.mockResolvedValue([]);
		const store = new MergeRequestsStore(clientFactory, notifier);

		expect(store.isCategoryLoaded('needsReview')).toBe(false);
		await store.loadPending();
		expect(store.isCategoryLoaded('needsReview')).toBe(true);
	});

	it('getCategoryMRs returns cached data', async () => {
		const { client, clientFactory, notifier } = createMocks();
		const mrs = [{ id: 1, iid: 1, project_id: 10, project_path: 'g/p' }];
		client.getPendingReviews.mockResolvedValue(mrs);
		const store = new MergeRequestsStore(clientFactory, notifier);

		await store.loadPending();

		expect(store.getCategoryMRs('needsReview')).toEqual(mrs);
	});

	it('getCategoryMRs returns empty for unknown category', () => {
		const { clientFactory, notifier } = createMocks();
		const store = new MergeRequestsStore(clientFactory, notifier);
		expect(store.getCategoryMRs('needsReview')).toEqual([]);
	});

	it('skips load if already loaded', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getPendingReviews.mockResolvedValue([]);
		const store = new MergeRequestsStore(clientFactory, notifier);

		await store.loadPending();
		client.getPendingReviews.mockClear();
		await store.loadPending();

		expect(client.getPendingReviews).toHaveBeenCalledTimes(0);
	});

	it('stores error on failure', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getPendingReviews.mockRejectedValue(new Error('fail'));
		const store = new MergeRequestsStore(clientFactory, notifier);

		await store.loadPending();

		expect(store.error).toContain('Не удалось загрузить merge requests');
	});

	it('returns empty when no client', async () => {
		const { clientFactory, notifier } = createMocks();
		clientFactory.create.mockResolvedValue(undefined);
		const store = new MergeRequestsStore(clientFactory, notifier);

		await store.loadPending();

		expect(store.getCategoryMRs('needsReview')).toEqual([]);
	});

	it('refresh clears all state', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getPendingReviews.mockResolvedValue([{ id: 1, iid: 1, project_id: 10, project_path: 'g/p' }]);
		const store = new MergeRequestsStore(clientFactory, notifier);

		await store.loadPending();
		store.refresh();

		expect(store.isCategoryLoaded('needsReview')).toBe(false);
		expect(store.getCategoryMRs('needsReview')).toEqual([]);
		expect(store.error).toBeUndefined();
	});

	it('fires onDidChange on state changes', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getPendingReviews.mockResolvedValue([]);
		const store = new MergeRequestsStore(clientFactory, notifier);
		const listener = jest.fn();

		store.onDidChange(listener);
		await store.loadPending();

		expect(listener).toHaveBeenCalledTimes(2);
	});

	it('loadFiles sets loading to files', async () => {
		const { client, clientFactory, notifier } = createMocks();
		const loadingStates: string[] = [];
		client.getMergeRequestFiles.mockImplementation(async () => {
			return [];
		});
		const store = new MergeRequestsStore(clientFactory, notifier);

		store.onDidChange(() => {
			loadingStates.push(store.loading);
		});

		await store.loadFiles({ project_id: 10, iid: 42 } as any);

		expect(loadingStates).toContain('files');
		expect(store.loading).toBe('idle');
	});
});
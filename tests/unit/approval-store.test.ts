import { MergeRequestApprovalStore } from '../../src/domain/store/MergeRequestApprovalStore';

function createMocks(): any {
	const client = {
		getApprovalData: jest.fn(),
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
	return { client, clientFactory, notifier };
}

describe('MergeRequestApprovalStore', () => {
	it('returns undefined before load', () => {
		const { clientFactory, notifier } = createMocks();
		const store = new MergeRequestApprovalStore(clientFactory, notifier);
		expect(store.getApprovalData({ project_id: 10, iid: 42 } as any)).toBeUndefined();
	});

	it('loads and caches approval data', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getApprovalData.mockResolvedValue({ approvedBy: [], requestedChanges: [] });
		const store = new MergeRequestApprovalStore(clientFactory, notifier);

		await store.loadApprovalData({ project_id: 10, iid: 42 } as any);

		expect(store.getApprovalData({ project_id: 10, iid: 42 } as any)).toEqual({
			approvedBy: [],
			requestedChanges: [],
		});
	});

	it('skips load if already cached', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getApprovalData.mockResolvedValue({ approvedBy: [], requestedChanges: [] });
		const store = new MergeRequestApprovalStore(clientFactory, notifier);

		await store.loadApprovalData({ project_id: 10, iid: 42 } as any);
		client.getApprovalData.mockClear();
		await store.loadApprovalData({ project_id: 10, iid: 42 } as any);

		expect(client.getApprovalData).toHaveBeenCalledTimes(0);
	});

	it('tracks loading state', async () => {
		const { client, clientFactory, notifier } = createMocks();
		let duringLoading = false;
		client.getApprovalData.mockImplementation(async () => {
			duringLoading = store.isApprovalLoading({ project_id: 10, iid: 42 } as any);
			return { approvedBy: [], requestedChanges: [] };
		});
		const store = new MergeRequestApprovalStore(clientFactory, notifier);

		await store.loadApprovalData({ project_id: 10, iid: 42 } as any);

		expect(duringLoading).toBe(true);
		expect(store.isApprovalLoading({ project_id: 10, iid: 42 } as any)).toBe(false);
	});

	it('clears loading flag on error', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getApprovalData.mockRejectedValue(new Error('fail'));
		const store = new MergeRequestApprovalStore(clientFactory, notifier);
		const mr = { project_id: 10, iid: 42 };

		await expect(store.loadApprovalData(mr as any)).rejects.toThrow();
		expect(store.isApprovalLoading(mr as any)).toBe(false);
	});

	it('refresh clears cache and loading', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getApprovalData.mockResolvedValue({ approvedBy: [], requestedChanges: [] });
		const store = new MergeRequestApprovalStore(clientFactory, notifier);
		const mr = { project_id: 10, iid: 42 };

		await store.loadApprovalData(mr as any);
		store.refresh();

		expect(store.getApprovalData(mr as any)).toBeUndefined();
		expect(store.isApprovalLoading(mr as any)).toBe(false);
	});

	it('returns early when no client', async () => {
		const { client, clientFactory, notifier } = createMocks();
		clientFactory.create.mockResolvedValue(undefined);
		const store = new MergeRequestApprovalStore(clientFactory, notifier);

		await store.loadApprovalData({ project_id: 10, iid: 42 } as any);
		expect(client.getApprovalData).not.toHaveBeenCalled();
	});
});
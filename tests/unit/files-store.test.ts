import { MergeRequestFilesStore } from '../../src/domain/store/MergeRequestFilesStore';

function createMocks(): any {
	const client = {
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
	return { client, clientFactory, notifier };
}

describe('MergeRequestFilesStore', () => {
	it('returns undefined before load', () => {
		const { clientFactory, notifier } = createMocks();
		const store = new MergeRequestFilesStore(clientFactory, notifier);
		expect(store.getFiles({ project_id: 10, iid: 42 } as any)).toBeUndefined();
	});

	it('loads and caches files', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getMergeRequestFiles.mockResolvedValue([{ path: 'a.ts' }]);
		const store = new MergeRequestFilesStore(clientFactory, notifier);

		await store.loadFiles({ project_id: 10, iid: 42 } as any);

		expect(store.getFiles({ project_id: 10, iid: 42 } as any)).toEqual([{ path: 'a.ts' }]);
	});

	it('skips load if already cached', async () => {
		const { client, clientFactory, notifier } = createMocks();
		const store = new MergeRequestFilesStore(clientFactory, notifier);

		await store.loadFiles({ project_id: 10, iid: 42 } as any);
		client.getMergeRequestFiles.mockClear();
		await store.loadFiles({ project_id: 10, iid: 42 } as any);

		expect(client.getMergeRequestFiles).toHaveBeenCalledTimes(0);
	});

	it('tracks loading state', async () => {
		const { client, clientFactory, notifier } = createMocks();
		let duringLoading = false;
		client.getMergeRequestFiles.mockImplementation(async () => {
			duringLoading = store.isFilesLoading({ project_id: 10, iid: 42 } as any);
			return [];
		});
		const store = new MergeRequestFilesStore(clientFactory, notifier);

		await store.loadFiles({ project_id: 10, iid: 42 } as any);

		expect(duringLoading).toBe(true);
		expect(store.isFilesLoading({ project_id: 10, iid: 42 } as any)).toBe(false);
	});

	it('hasFiles returns correct state', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getMergeRequestFiles.mockResolvedValue([{ path: 'a.ts' }]);
		const store = new MergeRequestFilesStore(clientFactory, notifier);
		const mr = { project_id: 10, iid: 42 };

		expect(store.hasFiles(mr as any)).toBe(false);
		await store.loadFiles(mr as any);
		expect(store.hasFiles(mr as any)).toBe(true);
	});

	it('clears loading flag on error', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getMergeRequestFiles.mockRejectedValue(new Error('fail'));
		const store = new MergeRequestFilesStore(clientFactory, notifier);
		const mr = { project_id: 10, iid: 42 };

		await expect(store.loadFiles(mr as any)).rejects.toThrow();
		expect(store.isFilesLoading(mr as any)).toBe(false);
	});

	it('refresh clears cache and loading', async () => {
		const { client, clientFactory, notifier } = createMocks();
		client.getMergeRequestFiles.mockResolvedValue([{ path: 'a.ts' }]);
		const store = new MergeRequestFilesStore(clientFactory, notifier);
		const mr = { project_id: 10, iid: 42 };

		await store.loadFiles(mr as any);
		store.refresh();

		expect(store.hasFiles(mr as any)).toBe(false);
		expect(store.isFilesLoading(mr as any)).toBe(false);
	});

	it('returns early when no client', async () => {
		const { client, clientFactory, notifier } = createMocks();
		clientFactory.create.mockResolvedValue(undefined);
		const store = new MergeRequestFilesStore(clientFactory, notifier);

		await store.loadFiles({ project_id: 10, iid: 42 } as any);
		expect(client.getMergeRequestFiles).not.toHaveBeenCalled();
	});
});
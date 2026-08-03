export interface Progress {
	withProgress<T>(task: () => Promise<T>): Promise<T>;
}
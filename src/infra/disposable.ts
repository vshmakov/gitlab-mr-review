export interface Disposable {
	dispose(): void;
}

export interface DisposableCollection {
	push(...disposables: Disposable[]): void;
	dispose(): void;
}
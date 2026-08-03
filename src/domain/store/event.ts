import { Disposable } from '../interfaces/disposable';

export interface Event<T> {
	(listener: (t: T) => void): Disposable;
}

export interface EventEmitter<T> {
	event: Event<T>;
	fire(data: T): void;
	dispose(): void;
}

export function createEventEmitter<T>(): EventEmitter<T> {
	return new SimpleEventEmitter<T>();
}

class SimpleEventEmitter<T> implements EventEmitter<T> {
	private listeners: ((t: T) => void)[] = [];

	get event(): Event<T> {
		return (listener) => {
			this.listeners.push(listener);
			return {
				dispose: () => {
					this.listeners = this.listeners.filter((l) => l !== listener);
				},
			};
		};
	}

	fire(data: T): void {
		for (const listener of this.listeners) {
			listener(data);
		}
	}

	dispose(): void {
		this.listeners = [];
	}
}
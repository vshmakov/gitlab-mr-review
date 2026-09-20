import { Disposable } from './disposable';

export interface CommandRegistry {
	register(id: string, handler: (...args: never[]) => unknown): Disposable;
	execute(id: string, ...args: unknown[]): Promise<unknown>;
}
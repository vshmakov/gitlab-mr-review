import { Disposable } from './disposable';

export interface CommandRegistry {
	register(id: string, handler: Function): Disposable;
	execute(id: string, ...args: unknown[]): Promise<unknown>;
}
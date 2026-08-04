import { createEventEmitter } from '../../src/domain/store/event';

describe('createEventEmitter', () => {
	it('fires data to registered listeners', () => {
		const emitter = createEventEmitter<string>();
		const listener = jest.fn();
		emitter.event(listener);

		emitter.fire('hello');

		expect(listener).toHaveBeenCalledWith('hello');
	});

	it('unsubscribe removes listener', () => {
		const emitter = createEventEmitter<string>();
		const listener = jest.fn();
		const sub = emitter.event(listener);

		sub.dispose();
		emitter.fire('hello');

		expect(listener).not.toHaveBeenCalled();
	});

	it('dispose clears all listeners', () => {
		const emitter = createEventEmitter<string>();
		const l1 = jest.fn();
		const l2 = jest.fn();
		emitter.event(l1);
		emitter.event(l2);

		emitter.dispose();
		emitter.fire('hello');

		expect(l1).not.toHaveBeenCalled();
		expect(l2).not.toHaveBeenCalled();
	});

	it('multiple fires deliver to all listeners', () => {
		const emitter = createEventEmitter<number>();
		const listener = jest.fn();
		emitter.event(listener);

		emitter.fire(1);
		emitter.fire(2);
		emitter.fire(3);

		expect(listener).toHaveBeenCalledWith(1);
		expect(listener).toHaveBeenCalledWith(2);
		expect(listener).toHaveBeenCalledWith(3);
	});
});
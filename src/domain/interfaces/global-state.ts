export interface GlobalState {
    get<T>(key: string, defaultValue?: T): T;
    update(key: string, value: unknown): Thenable<void>;
}
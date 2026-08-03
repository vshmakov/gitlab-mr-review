export interface Configuration {
	get<T>(section: string, key: string, fallback?: T): T;
	update<T>(section: string, key: string, value: T): Promise<void>;
}
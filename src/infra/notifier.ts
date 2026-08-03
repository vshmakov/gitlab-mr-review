export interface Notifier {
	showInfo(message: string): void;
	showError(message: string): void;
	showWarning(message: string): void;
}
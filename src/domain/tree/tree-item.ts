export type CollapsibleState = 'none' | 'collapsed' | 'expanded';

export interface Command {
	command: string;
	title: string;
	arguments?: unknown[];
}

export interface ITreeItem {
	readonly label: string;
	readonly description?: string;
	readonly tooltip?: string;
	readonly contextValue: string;
	readonly collapsibleState: CollapsibleState;
	readonly command?: Command;
	readonly icon?: { name: string; color?: string };
	readonly accessibilityLabel?: string;

	getChildren?(): ITreeItem[];
}
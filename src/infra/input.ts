export interface InputBoxOptions {
	title?: string;
	prompt?: string;
	value?: string;
	placeHolder?: string;
	password?: boolean;
	ignoreFocusOut?: boolean;
}

export interface Input {
	showInputBox(options: InputBoxOptions): Promise<string | undefined>;
	showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>;
}
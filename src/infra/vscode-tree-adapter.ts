import * as vscode from 'vscode';
import { ITreeItem } from './tree-item';

export function toVsCodeTreeItem(item: ITreeItem): vscode.TreeItem {
	const vscodeItem = new vscode.TreeItem(
		item.label,
		toVsCodeCollapsibleState(item.collapsibleState),
	);

	if (item.description) {
		vscodeItem.description = item.description;
	}
	if (item.tooltip) {
		vscodeItem.tooltip = item.tooltip;
	}
	vscodeItem.contextValue = item.contextValue;
	if (item.command) {
		vscodeItem.command = item.command;
	}
	if (item.icon) {
		vscodeItem.iconPath = new vscode.ThemeIcon(
			item.icon.name,
			item.icon.color
				? new vscode.ThemeColor(item.icon.color)
				: undefined,
		);
	}
	if (item.accessibilityLabel) {
		vscodeItem.accessibilityInformation = {
			label: item.accessibilityLabel,
			role: 'treeitem',
		};
	}

	return vscodeItem;
}

function toVsCodeCollapsibleState(
	state: string,
): vscode.TreeItemCollapsibleState {
	switch (state) {
		case 'none': return vscode.TreeItemCollapsibleState.None;
		case 'collapsed': return vscode.TreeItemCollapsibleState.Collapsed;
		case 'expanded': return vscode.TreeItemCollapsibleState.Expanded;
		default: return vscode.TreeItemCollapsibleState.None;
	}
}
import * as vscode from 'vscode';
import { SprintFlintAPI, Issue } from './api';

export class IssueItem extends vscode.TreeItem {
    constructor(
        public readonly issue: Issue,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(issue.title, collapsibleState);

        this.tooltip = `${issue.id}: ${issue.title}`;
        this.description = `${issue.id}${issue.points ? ` • ${issue.points}pts` : ''}${issue.assignee ? ` • @${issue.assignee}` : ''}`;
        this.contextValue = 'issue';
        
        // Set icon based on status
        this.iconPath = this.getStatusIcon(issue.status);

        // Command to open issue details on click
        this.command = {
            command: 'sprintflint.viewIssueDetails',
            title: 'View Issue',
            arguments: [issue]
        };
    }

    private getStatusIcon(status: string): vscode.ThemeIcon {
        const icons: { [key: string]: string } = {
            'backlog': 'archive',
            'todo': 'circle-outline',
            'in_progress': 'play-circle',
            'review': 'eye',
            'done': 'check'
        };
        return new vscode.ThemeIcon(icons[status] || 'circle');
    }
}

export class IssuesProvider implements vscode.TreeDataProvider<IssueItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<IssueItem | undefined | void> = new vscode.EventEmitter<IssueItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<IssueItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(
        private api: SprintFlintAPI,
        private type: 'mine' | 'sprint' | 'backlog'
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: IssueItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: IssueItem): Promise<IssueItem[]> {
        if (element) {
            return []; // No nested items for now
        }

        try {
            const issues = await this.api.getIssues(this.type);
            
            // Sort by status priority
            const statusOrder = ['in_progress', 'review', 'todo', 'backlog', 'done'];
            issues.sort((a, b) => {
                const aIndex = statusOrder.indexOf(a.status);
                const bIndex = statusOrder.indexOf(b.status);
                return aIndex - bIndex;
            });

            return issues.map(issue => new IssueItem(
                issue,
                vscode.TreeItemCollapsibleState.None
            ));
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load issues: ${error}`);
            return [];
        }
    }

    getParent?(element: IssueItem): vscode.ProviderResult<IssueItem> {
        return null;
    }
}

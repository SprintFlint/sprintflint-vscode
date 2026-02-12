import * as vscode from 'vscode';
import { SprintFlintAPI } from './api';
import { IssuesProvider } from './issuesProvider';

let api: SprintFlintAPI;

export function activate(context: vscode.ExtensionContext) {
    console.log('SprintFlint extension is now active');

    // Initialize API
    const config = vscode.workspace.getConfiguration('sprintflint');
    api = new SprintFlintAPI({
        apiToken: config.get('apiToken', ''),
        apiUrl: config.get('apiUrl', 'https://sprintflint.com/api/v1')
    });

    // Check authentication
    const isAuthenticated = !!config.get('apiToken');
    vscode.commands.executeCommand('setContext', 'sprintflint:authenticated', isAuthenticated);

    // Register tree data providers
    const myIssuesProvider = new IssuesProvider(api, 'mine');
    const sprintIssuesProvider = new IssuesProvider(api, 'sprint');
    const backlogProvider = new IssuesProvider(api, 'backlog');

    vscode.window.registerTreeDataProvider('sprintflint.myIssues', myIssuesProvider);
    vscode.window.registerTreeDataProvider('sprintflint.sprintIssues', sprintIssuesProvider);
    vscode.window.registerTreeDataProvider('sprintflint.backlog', backlogProvider);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('sprintflint.authenticate', async () => {
            const token = await vscode.window.showInputBox({
                prompt: 'Enter your SprintFlint API token',
                password: true,
                ignoreFocusOut: true
            });

            if (token) {
                await config.update('apiToken', token, true);
                api.setToken(token);
                vscode.commands.executeCommand('setContext', 'sprintflint:authenticated', true);
                vscode.window.showInformationMessage('SprintFlint: Authenticated successfully!');
                
                // Refresh all views
                myIssuesProvider.refresh();
                sprintIssuesProvider.refresh();
                backlogProvider.refresh();
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sprintflint.refreshIssues', () => {
            myIssuesProvider.refresh();
            sprintIssuesProvider.refresh();
            backlogProvider.refresh();
            vscode.window.showInformationMessage('SprintFlint: Issues refreshed');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sprintflint.createIssue', async () => {
            const title = await vscode.window.showInputBox({
                prompt: 'Issue title',
                placeHolder: 'Enter issue title...'
            });

            if (!title) return;

            const description = await vscode.window.showInputBox({
                prompt: 'Issue description (optional)',
                placeHolder: 'Enter description...'
            });

            const pointsStr = await vscode.window.showInputBox({
                prompt: 'Story points (optional)',
                placeHolder: 'e.g., 3'
            });

            const points = pointsStr ? parseInt(pointsStr) : undefined;

            try {
                const issue = await api.createIssue(title, description, points);
                vscode.window.showInformationMessage(`Created issue: ${issue.title}`);
                myIssuesProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create issue: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sprintflint.openIssue', (issue) => {
            if (issue && issue.id) {
                vscode.env.openExternal(vscode.Uri.parse(`https://sprintflint.com/issues/${issue.id}`));
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sprintflint.viewIssueDetails', async (issue) => {
            if (!issue || !issue.id) return;

            try {
                const details = await api.getIssue(issue.id);
                
                const panel = vscode.window.createWebviewPanel(
                    'sprintflintIssue',
                    details.title,
                    vscode.ViewColumn.One,
                    {}
                );

                panel.webview.html = getIssueWebviewContent(details);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to load issue: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sprintflint.startAutoplay', async (issue) => {
            if (!issue || !issue.id) return;

            const confirm = await vscode.window.showQuickPick(['Yes', 'No'], {
                placeHolder: `Start autoplay on "${issue.title}"?`
            });

            if (confirm === 'Yes') {
                try {
                    const run = await api.triggerAutoplay(issue.id);
                    vscode.window.showInformationMessage(`Autoplay started: ${run.id}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to start autoplay: ${error}`);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sprintflint.searchIssues', async () => {
            const query = await vscode.window.showInputBox({
                prompt: 'Search issues',
                placeHolder: 'Enter search query...'
            });

            if (query) {
                try {
                    const issues = await api.searchIssues(query);
                    
                    const items = issues.map(i => ({
                        label: `$(${getStatusIcon(i.status)}) ${i.title}`,
                        description: `${i.id} | ${i.points}pts`,
                        detail: i.assignee ? `Assigned to @${i.assignee}` : 'Unassigned',
                        issue: i
                    }));

                    const selected = await vscode.window.showQuickPick(items, {
                        placeHolder: 'Select an issue to open'
                    });

                    if (selected) {
                        vscode.commands.executeCommand('sprintflint.viewIssueDetails', selected.issue);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`Search failed: ${error}`);
                }
            }
        })
    );
}

function getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
        'backlog': 'archive',
        'todo': 'circle-outline',
        'in_progress': 'play-circle',
        'review': 'eye',
        'done': 'check'
    };
    return icons[status] || 'circle';
}

function getIssueWebviewContent(issue: any): string {
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-foreground); }
            h1 { font-size: 1.5em; margin-bottom: 0.5em; }
            .meta { color: var(--vscode-descriptionForeground); margin-bottom: 1em; }
            .status { display: inline-block; padding: 4px 8px; border-radius: 3px; background: var(--vscode-badge-background); }
            .points { color: var(--vscode-symbolIcon-colorForeground); }
            .description { margin-top: 1em; line-height: 1.6; white-space: pre-wrap; }
            .section { margin-top: 1.5em; }
            a { color: var(--vscode-textLink-foreground); }
        </style>
    </head>
    <body>
        <h1>${issue.title}</h1>
        <div class="meta">
            <span class="status">${issue.status.replace(/_/g, ' ').toUpperCase()}</span>
            ${issue.points ? `<span class="points"> • ${issue.points} points</span>` : ''}
            ${issue.assignee ? ` • Assigned to @${issue.assignee}` : ' • Unassigned'}
        </div>
        ${issue.description ? `
        <div class="section">
            <h3>Description</h3>
            <div class="description">${issue.description}</div>
        </div>
        ` : ''}
        <div class="section">
            <a href="https://sprintflint.com/issues/${issue.id}">Open in SprintFlint →</a>
        </div>
    </body>
    </html>`;
}

export function deactivate() {}

# SprintFlint VS Code Extension

View and manage SprintFlint issues directly in VS Code.

## Features

- **My Issues**: View all issues assigned to you
- **Current Sprint**: See all issues in the active sprint
- **Backlog**: Browse backlog items
- **Create Issues**: Quick issue creation from VS Code
- **Search**: Find issues across all sprints
- **Autoplay**: Trigger AI agents directly from the sidebar
- **Issue Details**: View full issue details in a webview panel

> The extension is in development and is not yet published to the VS Code Marketplace. To use SprintFlint with your editor today, the supported path is the hosted MCP server at [sprintflint.com/mcp](https://sprintflint.com/mcp) (Claude Desktop / Cursor / Zed / Claude Code, plus VS Code via Copilot Chat's MCP support).

## Installation (build from source)

```bash
git clone https://github.com/SprintFlint/sprintflint-vscode.git
cd sprintflint-vscode
npm install
npm run compile
vsce package          # produces a .vsix file
code --install-extension sprintflint-vscode-*.vsix
```

## Setup

1. Get your API token from https://sprintflint.com/accounts/edit (the "API Token" section on the profile page)
2. Open Command Palette (Cmd+Shift+P)
3. Run "SprintFlint: Authenticate"
4. Enter your API token

## Usage

### Sidebar Views

After authentication, you'll see three new views in the SprintFlint sidebar:

- **My Issues**: Issues assigned to you
- **Current Sprint**: All issues in the active sprint
- **Backlog**: Backlog items

Click any issue to view details in a panel.

### Commands

Open Command Palette (Cmd+Shift+P) and type "SprintFlint":

| Command | Description |
|---------|-------------|
| `SprintFlint: Authenticate` | Set API token |
| `SprintFlint: Refresh Issues` | Refresh all issue lists |
| `SprintFlint: Create Issue` | Create new issue |
| `SprintFlint: Search Issues` | Search across all issues |

### Keyboard Shortcuts

Add to your `keybindings.json`:

```json
{
    "key": "ctrl+shift+s",
    "command": "sprintflint.searchIssues"
},
{
    "key": "ctrl+shift+r",
    "command": "sprintflint.refreshIssues"
}
```

## Configuration

In VS Code settings (Cmd+,):

| Setting | Description | Default |
|---------|-------------|---------|
| `sprintflint.apiToken` | Your API token | "" |
| `sprintflint.apiUrl` | API endpoint | https://sprintflint.com/api/v1 |

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch

# Package
vsce package
```

## Publishing

```bash
# Login to VS Code Marketplace
vsce login sprintflint

# Publish
vsce publish
```

## License

MIT

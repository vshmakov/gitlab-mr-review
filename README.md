# GitLab MR Review

VS Code extension for reviewing GitLab merge requests.

## Features

- Groups merge requests into the following categories: `My`, `Needs My Review`, `I Requested Changes`, `I Approved`, and `Missed Review`
- Opens each file diff directly in the editor
- Adds draft comments to diff lines
- Approves merge requests and opens them in the browser
- Marks files as reviewed and persists this state between sessions
- Parses unified diffs and displays them as diff documents

## Installation

To install from source, install the dependencies and build the package:

```bash
npm install
npx vsce package
code --install-extension gitlab-mr-review-1.0.0.vsix
```

Alternatively, run the included installation script:

```bash
npm run install-ext
```

## Configuration

The extension does not require manual configuration edits. Run the following command from the Command Palette:

1. Run **GitLab MR Review: Authenticate**.
2. Enter the GitLab URL and Personal Access Token when prompted. The URL is saved to the VS Code setting `gitlabMrReview.url`, while the token is stored in VS Code SecretStorage.

## Commands

| Command | Description |
|---------|----------|
| `GitLab MR Review: Refresh` | Refresh the merge request list |
| `GitLab MR Review: Authenticate` | Authenticate with GitLab |
| `GitLab MR Review: Log Out` | Log out |
| `GitLab MR Review: Open File Patch` | Open a file diff in the editor |
| `GitLab MR Review: Add Comment` | Add a draft comment to a diff line |
| `GitLab MR Review: Approve` | Approve the selected merge request |
| `GitLab MR Review: Mark as Reviewed` | Mark a file as reviewed |
| `GitLab MR Review: Mark as Unreviewed` | Remove the reviewed mark from a file |

## Development

```bash
npm install
npm run check      # lint, compile, and unit tests
npm run watch      # watch TypeScript files
npm run audit      # audit dependencies
```

Start debugging in VS Code (F5) to open a new Extension Development Host window.

Contract tests run separately with `npm run test:contract` and require an accessible test GitLab instance and the environment variables from `.env`.
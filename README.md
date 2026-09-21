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

Download the latest `.vsix` file from the [GitHub Releases](https://github.com/vshmakov/gitlab-mr-review/releases) page.

Then install it in one of these ways:

- In VS Code, open **Extensions**, select **...** → **Install from VSIX...**, and choose the downloaded file.
- From the command line:

```bash
code --install-extension gitlab-mr-review-1.0.1.vsix
```

## Configuration

The extension does not require manual configuration edits. Run the following command from the Command Palette:

1. Run **GitLab MR Review: Authenticate**.
2. Enter the GitLab URL and Personal Access Token when prompted. The URL is saved to the VS Code setting `gitlabMrReview.url`, while the token is stored in VS Code SecretStorage.

## Commands

The extension contributes the following commands to the Command Palette:

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

To build and install the extension from source:

```bash
npm install
npm run install-ext
```

For development checks and debugging:

```bash
npm run check      # lint, compile, and unit tests
npm run watch      # watch TypeScript files
npm run audit      # audit dependencies
npm run release:create  # validate and package the current version
npm run release:publish # publish the prepared version to GitHub
```

Start debugging in VS Code (F5) to open a new Extension Development Host window.

Contract tests run separately with `npm run test:contract` and require an accessible test GitLab instance and the environment variables from `.env`.

See [docs/release.md](docs/release.md) for the complete release procedure.
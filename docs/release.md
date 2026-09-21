# Release Process

## Before Release

1. Update the version in `package.json`.
2. Update `README.md` to reflect the current release state.
3. Take a diff against the current release and sync the release notes/changelog accordingly.
4. Add the release notes to `CHANGELOG.md`.
5. Commit all changes. The publish step pushes the current commit.
6. Make sure `gh` is installed and authenticated:

```bash
gh auth status
```

7. Make sure `vsce` is available in the local environment.

## Prepare the Release

Run:

```bash
npm run release:create
```

This command:

- runs linting, compilation, and unit tests;
- removes old VSIX files for this extension;
- creates `gitlab-mr-review-<version>.vsix`.

Contract tests are not run by this command. Run `npm run test:contract` separately when a configured test GitLab instance is available.

## Publish the Release

After checking the generated VSIX file, run:

```bash
npm run release:publish
```

The command publishes the already prepared artifact by:

- pushes the current commit to `origin/master`;
- pushes the version tag `v<version>`;
- creates a GitHub Release with the VSIX attached and generated release notes.

Publishing changes the remote repository and creates a public release. Review the version, changelog, current branch, and generated VSIX before running it.
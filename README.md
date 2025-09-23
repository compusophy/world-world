# world-world

A brutalist minimalist webapp for editing files and pushing PRs to GitHub directly from the browser.

## Styleguide

- Ultra minimal HTML - no unnecessary tags
- Direct text content, no fluff
- htmx for DOM manipulation
- Web-based applications only - no native executables
- Simple, brutal, direct
- No frameworks unless absolutely necessary
- Raw HTML, raw CSS, minimal dependencies

## Usage

1. `npm install`
2. `npm start`
3. Open http://localhost:3000
4. Create a GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token" → **"Generate new token (classic)"**
   - **Important**: Do NOT use "Fine-grained tokens" - they don't work with this tool
   - Give it a name like "world-world editor"
   - For public repos: select `public_repo` scope
   - For private repos: select `repo` scope
   - Click "Generate token" and **copy it immediately**
5. Enter your GitHub personal access token
6. Edit the file content in the textarea
7. Click "commit change" to push directly to main (immediate deployment)
8. Or use "create pr" to create a pull request (creates a new branch and PR for review)
9. Click "load prs" to see open PRs, then "merge pr" to merge them directly from the UI

## Troubleshooting

- **"Failed to update file: 403 Forbidden"**: Your GitHub token lacks the required permissions. Make sure it has `public_repo` scope for public repositories or `repo` scope for private ones.
- **"Bad credentials"**: Your token is invalid or expired. Generate a new one.
- **"Not Found"**: Check that the repository exists and you have access to it.

## Features

- File editor with textarea
- Direct commit to main branch
- PR creation (creates new branches automatically)
- PR listing and merging (complete workflow)
- GitHub authentication via personal access token
- htmx-powered UI (minimal JavaScript)

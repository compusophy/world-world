const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Simple favicon handler
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content
});

let githubToken;

// Auth endpoint
app.post('/auth', (req, res) => {
    const { token } = req.body;
    if (token) {
        githubToken = token.trim(); // Remove any whitespace
        console.log('Token received, length:', githubToken.length);
        res.json({ success: 'GitHub connected!' });
    } else {
        res.json({ error: 'No token provided' });
    }
});

// Test token endpoint
app.post('/test-token', async (req, res) => {
    try {
        if (!githubToken) {
            return res.json({ error: 'No token set. Connect first.' });
        }

        const testResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!testResponse.ok) {
            const errorText = await testResponse.text();
            return res.json({ error: `Token test failed: ${testResponse.status} - ${errorText}` });
        }

        const user = await testResponse.json();
        res.json({ success: `Token works! Logged in as: ${user.login}` });

    } catch (error) {
        res.json({ error: error.message });
    }
});

// Commit endpoint
app.post('/commit', async (req, res) => {
    try {
        const { content, filePath, sha } = req.body;

        if (!githubToken) {
            return res.json({ error: 'GitHub not authenticated' });
        }

        // Get current file if sha not provided
        let currentSha = sha;
        if (!currentSha) {
            const getResponse = await fetch(`https://api.github.com/repos/compusophy/world-world/contents/${encodeURIComponent(filePath || 'index.html')}`, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!getResponse.ok) {
                throw new Error(`Failed to get file: ${getResponse.statusText}`);
            }

            const currentFile = await getResponse.json();
            currentSha = currentFile.sha;
        }

        // Update file
        const updateResponse = await fetch(`https://api.github.com/repos/compusophy/world-world/contents/${encodeURIComponent(filePath || 'index.html')}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update ${filePath || 'index.html'} from web editor`,
                content: Buffer.from(content).toString('base64'),
                sha: currentSha
            })
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('GitHub API Error:', updateResponse.status, errorText);
            throw new Error(`Failed to update file: ${updateResponse.status} ${updateResponse.statusText} - ${errorText}`);
        }

        res.json({ success: 'Committed successfully!' });

    } catch (error) {
        console.error(error);
        res.json({ error: error.message });
    }
});

// Create PR endpoint
app.post('/create-pr', async (req, res) => {
    try {
        const { title, body, content, filePath } = req.body;

        if (!githubToken) {
            return res.json({ error: 'GitHub not authenticated' });
        }

        // Generate a unique branch name
        const branchName = `web-editor-${Date.now()}`;

        // First get the current main branch SHA
        const mainBranchResponse = await fetch('https://api.github.com/repos/compusophy/world-world/git/ref/heads/main', {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!mainBranchResponse.ok) {
            const errorText = await mainBranchResponse.text();
            throw new Error(`Failed to get main branch: ${mainBranchResponse.status} ${mainBranchResponse.statusText} - ${errorText}`);
        }

        const mainBranch = await mainBranchResponse.json();

        // Create new branch
        const createBranchResponse = await fetch('https://api.github.com/repos/compusophy/world-world/git/refs', {
            method: 'POST',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: `refs/heads/${branchName}`,
                sha: mainBranch.object.sha
            })
        });

        if (!createBranchResponse.ok) {
            const errorText = await createBranchResponse.text();
            throw new Error(`Failed to create branch: ${createBranchResponse.status} ${createBranchResponse.statusText} - ${errorText}`);
        }

        // Commit changes to the new branch
        const getResponse = await fetch(`https://api.github.com/repos/compusophy/world-world/contents/${encodeURIComponent(filePath || 'index.html')}`, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!getResponse.ok) {
            const errorText = await getResponse.text();
            throw new Error(`Failed to get file: ${getResponse.status} ${getResponse.statusText} - ${errorText}`);
        }

        const currentFile = await getResponse.json();

        const updateResponse = await fetch(`https://api.github.com/repos/compusophy/world-world/contents/${encodeURIComponent(filePath || 'index.html')}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Update from web editor',
                content: Buffer.from(content).toString('base64'),
                sha: currentFile.sha,
                branch: branchName
            })
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Failed to update file on branch: ${updateResponse.status} ${updateResponse.statusText} - ${errorText}`);
        }

        // Create PR from new branch to main
        const prResponse = await fetch('https://api.github.com/repos/compusophy/world-world/pulls', {
            method: 'POST',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title || 'Update from web editor',
                body: body || 'Changes made via web editor',
                head: branchName,
                base: 'main'
            })
        });

        if (!prResponse.ok) {
            const errorText = await prResponse.text();
            console.error('GitHub API Error:', prResponse.status, errorText);
            throw new Error(`Failed to create PR: ${prResponse.status} ${prResponse.statusText} - ${errorText}`);
        }

        const pr = await prResponse.json();
        res.json({ success: `PR created: ${pr.html_url}` });

    } catch (error) {
        console.error(error);
        res.json({ error: error.message });
    }
});

// Merge PR endpoint
app.post('/merge-pr', async (req, res) => {
    try {
        const { prNumber, commitTitle, commitMessage } = req.body;

        if (!githubToken) {
            return res.json({ error: 'GitHub not authenticated' });
        }

        if (!prNumber) {
            return res.json({ error: 'PR number required' });
        }

        const mergeResponse = await fetch(`https://api.github.com/repos/compusophy/world-world/pulls/${prNumber}/merge`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                commit_title: commitTitle || `Merge pull request #${prNumber}`,
                commit_message: commitMessage || '',
                merge_method: 'merge' // or 'squash' or 'rebase'
            })
        });

        if (!mergeResponse.ok) {
            const errorText = await mergeResponse.text();
            console.error('GitHub API Error:', mergeResponse.status, errorText);
            throw new Error(`Failed to merge PR: ${mergeResponse.status} ${mergeResponse.statusText} - ${errorText}`);
        }

        const mergeResult = await mergeResponse.json();
        res.json({ success: `PR #${prNumber} merged successfully!` });

    } catch (error) {
        console.error(error);
        res.json({ error: error.message });
    }
});

// List repository files endpoint
app.get('/files', async (req, res) => {
    try {
        if (!githubToken) {
            return res.send('<p>GitHub not authenticated</p>');
        }

        const filesResponse = await fetch('https://api.github.com/repos/compusophy/world-world/contents', {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!filesResponse.ok) {
            const errorText = await filesResponse.text();
            return res.send(`<p>Error loading files: ${filesResponse.status} ${filesResponse.statusText}</p>`);
        }

        const files = await filesResponse.json();

        if (files.length === 0) {
            return res.send('<p>No files in repository</p>');
        }

        let html = '<h3>Repository Files</h3>';
        files.forEach(file => {
            if (file.type === 'file') {
                html += `
                    <div style="margin:5px;">
                        <a href="#" onclick="loadFile('${file.path}'); return false;" style="text-decoration:none;">
                            📄 ${file.name}
                        </a>
                    </div>
                `;
            } else if (file.type === 'dir') {
                html += `
                    <div style="margin:5px;">
                        📁 ${file.name}/
                    </div>
                `;
            }
        });

        res.send(html);

    } catch (error) {
        console.error(error);
        res.send(`<p>Error: ${error.message}</p>`);
    }
});

// Load file content endpoint
app.get('/file/*', async (req, res) => {
    try {
        const filePath = req.params[0];

        if (!githubToken) {
            return res.json({ error: 'GitHub not authenticated' });
        }

        const fileResponse = await fetch(`https://api.github.com/repos/compusophy/world-world/contents/${encodeURIComponent(filePath)}`, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!fileResponse.ok) {
            const errorText = await fileResponse.text();
            return res.json({ error: `Failed to load file: ${fileResponse.status} ${fileResponse.statusText} - ${errorText}` });
        }

        const fileData = await fileResponse.json();

        // Decode base64 content
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');

        res.json({
            content: content,
            path: filePath,
            sha: fileData.sha
        });

    } catch (error) {
        console.error(error);
        res.json({ error: error.message });
    }
});

// List PRs endpoint
app.get('/prs', async (req, res) => {
    try {
        if (!githubToken) {
            return res.send('<p>GitHub not authenticated</p>');
        }

        const prsResponse = await fetch('https://api.github.com/repos/compusophy/world-world/pulls?state=open', {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!prsResponse.ok) {
            const errorText = await prsResponse.text();
            return res.send(`<p>Error loading PRs: ${prsResponse.status} ${prsResponse.statusText}</p>`);
        }

        const prs = await prsResponse.json();

        if (prs.length === 0) {
            return res.send('<p>No open PRs</p>');
        }

        let html = '<h3>Open PRs</h3>';
        prs.forEach(pr => {
            html += `
                <div style="border:1px solid #ccc; margin:10px; padding:10px;">
                    <h4>PR #${pr.number}: ${pr.title}</h4>
                    <p>${pr.body || 'No description'}</p>
                    <p>From: ${pr.head.ref} → ${pr.base.ref}</p>
                    <form hx-post="/merge-pr" hx-target="#status" hx-swap="innerHTML" style="display:inline;">
                        <input type="hidden" name="prNumber" value="${pr.number}">
                        <input type="hidden" name="commitTitle" value="Merge pull request #${pr.number}">
                        <button type="submit">merge pr</button>
                    </form>
                </div>
            `;
        });

        res.send(html);

    } catch (error) {
        console.error(error);
        res.send(`<p>Error: ${error.message}</p>`);
    }
});

app.listen(PORT, () => {
    console.log(`world-world editor running on port ${PORT}`);
});

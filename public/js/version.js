// js/version.js

document.addEventListener('DOMContentLoaded', () => {
    // Container to display commit history
    const container = document.getElementById('commit-history-container');
    
    // Check if container exists
    if (!container) {
        console.error("Container #commit-history-container not found.");
        return;
    }

    // GitHub API URL for your repo
    const owner = 'professionalman';
    const repo = 'Music_Website';
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;

    // Function to format date for readability
    function formatDate(isoString) {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'full',
            timeStyle: 'medium'
        }).format(date);
    }

    // Async function to fetch data
    async function fetchCommits() {
        try {
            // Call API
            const response = await fetch(apiUrl);

            // Handle error if API doesn't return successfully
            if (!response.ok) {
                throw new Error(`Error from GitHub API: ${response.status} ${response.statusText}`);
            }

            // Convert response to JSON
            const commits = await response.json();

            // Clear "Loading..." message
            container.innerHTML = '';
            
            if (commits.length === 0) {
                 container.innerHTML = '<p>No commits found.</p>';
                 return;
            }

            // Loop through each commit and create HTML
            commits.forEach(commitData => {
                const { commit, html_url, author } = commitData;

                // Split message into title and body (if exists)
                const messageParts = commit.message.split('\n\n');
                const title = messageParts[0];
                const body = messageParts.slice(1).join('\n\n');

                // Create a card for each commit
                const commitEntry = document.createElement('div');
                commitEntry.className = 'commit-entry';

                // Create title (commit message)
                const commitTitle = document.createElement('h3');
                commitTitle.textContent = title;

                // Create author and date info
                const commitMeta = document.createElement('p');
                commitMeta.className = 'commit-meta';
                commitMeta.innerHTML = `
                    by <strong>${commit.author.name}</strong> on ${formatDate(commit.author.date)}
                `;

                // Create commit body (if exists)
                let commitBody = null;
                if (body) {
                    commitBody = document.createElement('pre');
                    commitBody.className = 'commit-body';
                    commitBody.textContent = body;
                }

                // Create link to view details on GitHub
                const commitLink = document.createElement('a');
                commitLink.href = html_url;
                commitLink.textContent = 'View details on GitHub';
                commitLink.target = '_blank'; // Open in new tab
                commitLink.rel = 'noopener noreferrer';
                commitLink.className = 'commit-link';

                // Append child elements to card
                commitEntry.appendChild(commitTitle);
                commitEntry.appendChild(commitMeta);
                if (commitBody) {
                    commitEntry.appendChild(commitBody);
                }
                commitEntry.appendChild(commitLink);

                // Append commit card to main container
                container.appendChild(commitEntry);
            });

        } catch (error) {
            console.error('Unable to fetch commits from GitHub:', error);
            container.innerHTML = `<p class="error-message">An error occurred while loading version history. Please try again later. <br><small>${error.message}</small></p>`;
        }
    }

    // Call function to start fetching
    fetchCommits();
});
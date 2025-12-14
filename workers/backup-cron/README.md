# Encrypted Notes Backup Cron Worker

Cloudflare Worker that automatically backs up encrypted Nostr events from D1 database to a private GitHub repository every 6 hours.

## Features

- **Automated Backups**: Runs every 6 hours via Cloudflare Cron Triggers
- **Encrypted Events Only**: Backs up kind 4 (encrypted DM), 1059 (gift-wrapped), and 30078 (app-specific encrypted)
- **GitHub Storage**: Stores backups in private GitHub repository with organized directory structure
- **Automatic Cleanup**: Removes backups older than 30 days (configurable)
- **Metadata Tracking**: Includes backup timestamp, event count, date ranges, and event kinds
- **Manual Trigger**: HTTP endpoint for testing and manual backups

## Setup

### 1. Create Private GitHub Repository

Create a private repository on GitHub to store your backups.

### 2. Generate GitHub Personal Access Token

1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token with `repo` scope (full control of private repositories)
3. Copy the token (starts with `ghp_`)

### 3. Configure Environment Variables

Edit `wrangler.toml`:

```toml
[vars]
GITHUB_REPO = "your-username/your-private-repo"
GITHUB_BRANCH = "main"
BACKUP_RETENTION_DAYS = "30"
```

### 4. Set GitHub Token Secret

```bash
cd workers/backup-cron
wrangler secret put GITHUB_TOKEN
# Paste your GitHub personal access token when prompted
```

### 5. Deploy Worker

```bash
npm install
npm run deploy
```

## Backup Structure

Backups are organized by date and time:

```
backups/
├── 2025-12-14/
│   ├── 00-00-encrypted-events.json
│   ├── 06-00-encrypted-events.json
│   ├── 12-00-encrypted-events.json
│   └── 18-00-encrypted-events.json
├── 2025-12-15/
│   ├── 00-00-encrypted-events.json
│   └── ...
```

Each backup file contains:

```json
{
  "metadata": {
    "timestamp": "2025-12-14T12:00:00.000Z",
    "eventCount": 142,
    "kinds": [4, 1059, 30078],
    "dateRange": {
      "oldest": 1702561234,
      "newest": 1702994567
    },
    "version": "1.0.0"
  },
  "events": [
    {
      "id": "...",
      "pubkey": "...",
      "created_at": 1702994567,
      "kind": 4,
      "tags": "...",
      "content": "...",
      "sig": "..."
    }
  ]
}
```

## Manual Backup

Trigger a backup manually via HTTP:

```bash
curl https://nosflare-backup-cron.your-subdomain.workers.dev/
```

## Monitoring

View worker logs:

```bash
npm run tail
```

View cron execution history in Cloudflare dashboard:
- Workers & Pages > nosflare-backup-cron > Logs

## Configuration

### Change Backup Frequency

Edit `wrangler.toml`:

```toml
[triggers]
# Every 6 hours (default)
crons = ["0 */6 * * *"]

# Other examples:
# Every 12 hours: crons = ["0 */12 * * *"]
# Daily at midnight: crons = ["0 0 * * *"]
# Every 3 hours: crons = ["0 */3 * * *"]
```

### Change Retention Period

Edit `wrangler.toml`:

```toml
[vars]
BACKUP_RETENTION_DAYS = "60"  # Keep backups for 60 days
```

## Security

- **GitHub Token**: Stored as Cloudflare Worker secret (encrypted)
- **Private Repository**: Backups stored in private GitHub repo
- **Encrypted Content**: Events are already encrypted in the database
- **Access Control**: Worker runs in your Cloudflare account

## Troubleshooting

### "GITHUB_TOKEN not configured"

Set the secret:
```bash
wrangler secret put GITHUB_TOKEN
```

### "Failed to create/update file: 404"

Check that `GITHUB_REPO` is correct and token has `repo` scope.

### "No encrypted events to backup"

Database may be empty or contain only public events (kind 1, etc.).

## Development

Run locally:
```bash
npm run dev
```

Type checking:
```bash
npm run typecheck
```

## Cost

- **Cloudflare Workers**: Free tier includes 100,000 requests/day and 3 Cron Triggers
- **GitHub**: Free for private repositories
- **Total**: $0/month on free tier

## License

Same as parent project.

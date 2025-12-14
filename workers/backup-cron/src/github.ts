/**
 * GitHub API helper for creating/updating files
 */

export interface GitHubConfig {
  token: string;
  repo: string;
  branch: string;
}

export interface GitHubFileResponse {
  sha: string;
  content: string;
  encoding: string;
}

/**
 * Get existing file SHA from GitHub
 */
async function getFileSha(
  repo: string,
  path: string,
  branch: string,
  token: string
): Promise<string | null> {
  const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Nosflare-Backup-Worker'
    }
  });

  if (response.status === 404) {
    return null; // File doesn't exist
  }

  if (!response.ok) {
    throw new Error(`Failed to get file SHA: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as GitHubFileResponse;
  return data.sha;
}

/**
 * Create or update a file in GitHub repository
 */
export async function createOrUpdateFile(
  config: GitHubConfig,
  path: string,
  content: string,
  message: string
): Promise<void> {
  const { repo, branch, token } = config;

  // Get existing file SHA if it exists
  const sha = await getFileSha(repo, path, branch, token);

  // Base64 encode content
  const contentBase64 = btoa(content);

  const url = `https://api.github.com/repos/${repo}/contents/${path}`;

  const body: Record<string, string> = {
    message,
    content: contentBase64,
    branch
  };

  // Include SHA if updating existing file
  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Nosflare-Backup-Worker',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create/update file: ${response.status} ${response.statusText} - ${errorText}`);
  }
}

/**
 * List files in a directory
 */
export async function listFiles(
  config: GitHubConfig,
  path: string
): Promise<Array<{ name: string; path: string; sha: string }>> {
  const { repo, branch, token } = config;
  const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Nosflare-Backup-Worker'
    }
  });

  if (response.status === 404) {
    return []; // Directory doesn't exist
  }

  if (!response.ok) {
    throw new Error(`Failed to list files: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Delete a file from GitHub repository
 */
export async function deleteFile(
  config: GitHubConfig,
  path: string,
  message: string
): Promise<void> {
  const { repo, branch, token } = config;

  // Get file SHA
  const sha = await getFileSha(repo, path, branch, token);
  if (!sha) {
    return; // File doesn't exist, nothing to delete
  }

  const url = `https://api.github.com/repos/${repo}/contents/${path}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Nosflare-Backup-Worker',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      sha,
      branch
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`);
  }
}

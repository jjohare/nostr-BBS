<script lang="ts">
  import { onMount } from 'svelte';
  import {
    searchSimilar,
    isSearchAvailable,
    getSearchStats,
    loadIndex,
    type SearchResult
  } from './hnsw-search';
  import { getLocalSyncState, syncEmbeddings, shouldSync } from './embeddings-sync';

  // Props
  export let onSelect: (noteId: string) => void = () => {};
  export let placeholder = 'Search by meaning...';

  // State
  let query = '';
  let results: SearchResult[] = [];
  let isSearching = false;
  let error: string | null = null;
  let stats: { vectorCount: number; dimensions: number } | null = null;
  let syncState: { version: number; lastSynced: number } | null = null;
  let indexLoaded = false;

  // Debounce search
  let searchTimeout: ReturnType<typeof setTimeout>;

  onMount(async () => {
    // Load sync state
    const state = await getLocalSyncState();
    if (state) {
      syncState = { version: state.version, lastSynced: state.lastSynced };
    }

    // Try to load index
    if (state?.version) {
      try {
        indexLoaded = await loadIndex();
        if (indexLoaded) {
          stats = getSearchStats();
        }
      } catch (e) {
        console.warn('Failed to load search index:', e);
      }
    }
  });

  async function handleSearch() {
    if (!query.trim()) {
      results = [];
      return;
    }

    if (!indexLoaded) {
      error = 'Search index not loaded. Sync embeddings first.';
      return;
    }

    isSearching = true;
    error = null;

    try {
      results = await searchSimilar(query, 10, 0.3);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Search failed';
      results = [];
    } finally {
      isSearching = false;
    }
  }

  function handleInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(handleSearch, 300);
  }

  async function handleSync() {
    if (!shouldSync()) {
      error = 'Please connect to WiFi to sync embeddings';
      return;
    }

    isSearching = true;
    error = null;

    try {
      const result = await syncEmbeddings(true);
      if (result.synced) {
        syncState = { version: result.version, lastSynced: Date.now() };
        indexLoaded = await loadIndex();
        if (indexLoaded) {
          stats = getSearchStats();
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Sync failed';
    } finally {
      isSearching = false;
    }
  }

  function selectResult(noteId: string) {
    onSelect(noteId);
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }
</script>

<div class="semantic-search">
  <div class="search-header">
    <div class="search-input-wrapper">
      <input
        type="text"
        bind:value={query}
        on:input={handleInput}
        {placeholder}
        class="search-input"
        disabled={!indexLoaded}
      />
      {#if isSearching}
        <span class="loading-indicator">...</span>
      {/if}
    </div>

    <button
      class="sync-btn"
      on:click={handleSync}
      disabled={isSearching}
      title="Sync embeddings"
    >
      ↻
    </button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if !indexLoaded}
    <div class="info-message">
      <p>Semantic search requires downloading the search index.</p>
      {#if shouldSync()}
        <button on:click={handleSync} disabled={isSearching}>
          Download Index
        </button>
      {:else}
        <p class="wifi-notice">Connect to WiFi to download.</p>
      {/if}
    </div>
  {:else if stats}
    <div class="stats">
      <span>{stats.vectorCount.toLocaleString()} messages indexed</span>
      {#if syncState}
        <span>v{syncState.version} • {formatDate(syncState.lastSynced)}</span>
      {/if}
    </div>
  {/if}

  {#if results.length > 0}
    <div class="results">
      {#each results as result}
        <button
          class="result-item"
          on:click={() => selectResult(result.noteId)}
        >
          <span class="note-id">{result.noteId.slice(0, 8)}...</span>
          <span class="score">{(result.score * 100).toFixed(0)}% match</span>
        </button>
      {/each}
    </div>
  {:else if query && !isSearching && indexLoaded}
    <div class="no-results">No matching messages found</div>
  {/if}
</div>

<style>
  .semantic-search {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
  }

  .search-header {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .search-input-wrapper {
    flex: 1;
    position: relative;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--input-bg, #fff);
    color: var(--text-color, #333);
  }

  .search-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading-indicator {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .sync-btn {
    padding: 0.75rem;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    background: var(--btn-bg, #f5f5f5);
    cursor: pointer;
    font-size: 1.2rem;
  }

  .sync-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error-message {
    padding: 0.5rem;
    background: #fee;
    color: #c00;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .info-message {
    padding: 1rem;
    background: var(--info-bg, #f0f7ff);
    border-radius: 8px;
    text-align: center;
  }

  .info-message button {
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--primary-color, #0066cc);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .wifi-notice {
    font-size: 0.875rem;
    color: var(--muted-color, #666);
  }

  .stats {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--muted-color, #666);
  }

  .results {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 300px;
    overflow-y: auto;
  }

  .result-item {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem;
    background: var(--result-bg, #fafafa);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
    width: 100%;
  }

  .result-item:hover {
    background: var(--result-hover-bg, #f0f0f0);
  }

  .note-id {
    font-family: monospace;
    font-size: 0.875rem;
  }

  .score {
    font-size: 0.75rem;
    color: var(--muted-color, #666);
    background: var(--score-bg, #e8f5e9);
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
  }

  .no-results {
    text-align: center;
    padding: 1rem;
    color: var(--muted-color, #666);
  }
</style>

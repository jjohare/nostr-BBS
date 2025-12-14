/**
 * Semantic Search Module
 * Re-exports all semantic search functionality
 */

export {
  syncEmbeddings,
  initEmbeddingSync,
  fetchManifest,
  shouldSync,
  getLocalSyncState,
  type EmbeddingManifest
} from './embeddings-sync';

export {
  loadIndex,
  searchSimilar,
  isSearchAvailable,
  getSearchStats,
  unloadIndex,
  type SearchResult
} from './hnsw-search';

export { default as SemanticSearch } from './SemanticSearch.svelte';

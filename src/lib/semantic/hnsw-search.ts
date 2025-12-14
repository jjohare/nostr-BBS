/**
 * HNSW Vector Search Service
 * Uses hnswlib-wasm for fast approximate nearest neighbor search
 */

import { db } from '$lib/db';
import type { EmbeddingManifest } from './embeddings-sync';

// Types for hnswlib-wasm
interface HnswIndex {
  searchKnn(query: number[], k: number): { neighbors: number[]; distances: number[] };
  setEf(ef: number): void;
}

interface HnswLib {
  HierarchicalNSW: new (space: string, dim: number) => HnswIndex;
}

let hnswLib: HnswLib | null = null;
let searchIndex: HnswIndex | null = null;
let labelMapping: Map<number, string> | null = null;
let indexDimensions = 384;

/**
 * Load hnswlib-wasm dynamically
 */
async function loadHnswLib(): Promise<HnswLib> {
  if (hnswLib) return hnswLib;

  try {
    // Dynamic import of hnswlib-wasm
    const module = await import('hnswlib-wasm');
    const { loadHnswlib } = module;
    hnswLib = await loadHnswlib();
    return hnswLib;
  } catch (error) {
    console.error('Failed to load hnswlib-wasm:', error);
    throw new Error('HNSW search not available');
  }
}

/**
 * Load index from IndexedDB into memory
 */
export async function loadIndex(): Promise<boolean> {
  try {
    // Get index data from IndexedDB
    const indexData = await db.table('embeddings').get('hnsw_index');
    const mappingData = await db.table('embeddings').get('index_mapping');

    if (!indexData?.data || !mappingData?.data) {
      console.log('No index data in IndexedDB');
      return false;
    }

    // Load HNSW library
    const lib = await loadHnswLib();

    // Create index and load from binary
    searchIndex = new lib.HierarchicalNSW('cosine', indexDimensions);

    // Load index from ArrayBuffer
    // Note: hnswlib-wasm expects a specific format
    // This may need adjustment based on actual library API
    const indexBlob = new Blob([indexData.data]);
    const indexUrl = URL.createObjectURL(indexBlob);

    // Parse mapping (NPZ format - simplified parsing)
    const mappingArray = new Uint8Array(mappingData.data);
    labelMapping = parseNpzMapping(mappingArray);

    // Set search ef parameter
    searchIndex.setEf(50);

    console.log(`Index loaded with ${labelMapping.size} vectors`);
    return true;
  } catch (error) {
    console.error('Failed to load HNSW index:', error);
    return false;
  }
}

/**
 * Parse NPZ mapping file (simplified)
 * In production, use a proper NPZ parser
 */
function parseNpzMapping(data: Uint8Array): Map<number, string> {
  const mapping = new Map<number, string>();

  try {
    // NPZ files are ZIP archives
    // For simplicity, we'll store mapping as JSON instead
    // This should be updated when the Python scripts output JSON mapping
    const text = new TextDecoder().decode(data);
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed.labels) && Array.isArray(parsed.ids)) {
      for (let i = 0; i < parsed.labels.length; i++) {
        mapping.set(parsed.labels[i], parsed.ids[i]);
      }
    }
  } catch {
    console.warn('Failed to parse mapping, using index as ID');
  }

  return mapping;
}

/**
 * Generate query embedding
 * In production, this would use a lightweight model or server-side embedding
 */
async function embedQuery(query: string): Promise<number[]> {
  // For now, use a simple TF-IDF-like approach
  // In production, either:
  // 1. Use a small ONNX model in browser
  // 2. Call a server endpoint
  // 3. Use pre-computed query embeddings

  // Placeholder: random vector (should be replaced with actual embedding)
  console.warn('Using placeholder embedding - implement real embedding service');
  const vector = new Array(indexDimensions).fill(0).map(() => Math.random() * 2 - 1);

  // Normalize
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return vector.map(v => v / norm);
}

export interface SearchResult {
  noteId: string;
  score: number;
  distance: number;
}

/**
 * Search for similar notes
 */
export async function searchSimilar(
  query: string,
  k: number = 10,
  minScore: number = 0.5
): Promise<SearchResult[]> {
  // Ensure index is loaded
  if (!searchIndex || !labelMapping) {
    const loaded = await loadIndex();
    if (!loaded) {
      throw new Error('HNSW index not available');
    }
  }

  // Generate query embedding
  const queryVector = await embedQuery(query);

  // Search HNSW index
  const { neighbors, distances } = searchIndex!.searchKnn(queryVector, k);

  // Convert to results with note IDs
  const results: SearchResult[] = [];

  for (let i = 0; i < neighbors.length; i++) {
    const label = neighbors[i];
    const distance = distances[i];

    // Convert cosine distance to similarity score
    const score = 1 - distance;

    if (score >= minScore) {
      const noteId = labelMapping!.get(label) || String(label);
      results.push({
        noteId,
        score,
        distance
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Check if semantic search is available
 */
export function isSearchAvailable(): boolean {
  return searchIndex !== null && labelMapping !== null;
}

/**
 * Get search statistics
 */
export function getSearchStats(): { vectorCount: number; dimensions: number } | null {
  if (!labelMapping) return null;

  return {
    vectorCount: labelMapping.size,
    dimensions: indexDimensions
  };
}

/**
 * Unload index to free memory
 */
export function unloadIndex(): void {
  searchIndex = null;
  labelMapping = null;
}

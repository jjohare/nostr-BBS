#!/usr/bin/env python3
"""
Generate embeddings for Nostr notes using sentence-transformers.
Supports int8 quantization for reduced storage.
"""

import json
import argparse
import numpy as np
from pathlib import Path
from tqdm import tqdm

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("Installing sentence-transformers...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'sentence-transformers'])
    from sentence_transformers import SentenceTransformer


def load_notes(input_path: str) -> list[dict]:
    """Load notes from JSON file."""
    with open(input_path, 'r') as f:
        return json.load(f)


def clean_content(content: str) -> str:
    """Clean note content for embedding."""
    # Remove nostr: URIs
    import re
    content = re.sub(r'nostr:[a-zA-Z0-9]+', '', content)
    # Remove URLs
    content = re.sub(r'https?://\S+', '', content)
    # Collapse whitespace
    content = ' '.join(content.split())
    return content.strip()


def quantize_int8(vectors: np.ndarray) -> tuple[np.ndarray, float, float]:
    """Quantize float32 vectors to int8 for storage efficiency."""
    # Compute global min/max for consistent quantization
    vmin = vectors.min()
    vmax = vectors.max()

    # Scale to 0-255 range, then shift to -128 to 127
    scale = 255.0 / (vmax - vmin + 1e-8)
    quantized = ((vectors - vmin) * scale - 128).astype(np.int8)

    return quantized, float(vmin), float(scale)


def dequantize_int8(quantized: np.ndarray, vmin: float, scale: float) -> np.ndarray:
    """Dequantize int8 vectors back to float32."""
    return ((quantized.astype(np.float32) + 128) / scale) + vmin


def generate_embeddings(
    input_path: str,
    model_name: str,
    output_path: str,
    quantize: str = 'none',
    batch_size: int = 32
):
    """Generate embeddings for all notes."""

    # Load notes
    notes = load_notes(input_path)
    if not notes:
        print("No notes to process")
        # Create empty output
        np.savez(output_path, ids=np.array([]), vectors=np.array([]))
        return

    print(f"Loaded {len(notes)} notes")

    # Load model
    print(f"Loading model: {model_name}")
    model = SentenceTransformer(model_name)

    # Prepare texts
    texts = []
    ids = []
    for note in notes:
        cleaned = clean_content(note['content'])
        if len(cleaned) > 10:  # Skip very short content
            texts.append(cleaned)
            ids.append(note['id'])

    print(f"Processing {len(texts)} notes with valid content")

    if not texts:
        print("No valid content to embed")
        np.savez(output_path, ids=np.array([]), vectors=np.array([]))
        return

    # Generate embeddings in batches
    print("Generating embeddings...")
    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=True  # L2 normalize for cosine similarity
    )

    print(f"Generated {len(embeddings)} embeddings with shape {embeddings.shape}")

    # Quantize if requested
    if quantize == 'int8':
        print("Quantizing to int8...")
        quantized, vmin, scale = quantize_int8(embeddings)
        np.savez(
            output_path,
            ids=np.array(ids),
            vectors=quantized,
            quantize_min=vmin,
            quantize_scale=scale,
            quantize_type='int8',
            model=model_name,
            dimensions=embeddings.shape[1]
        )

        # Report size savings
        original_size = embeddings.nbytes
        quantized_size = quantized.nbytes
        print(f"Quantization: {original_size:,} bytes -> {quantized_size:,} bytes ({quantized_size/original_size:.1%})")
    else:
        np.savez(
            output_path,
            ids=np.array(ids),
            vectors=embeddings,
            quantize_type='float32',
            model=model_name,
            dimensions=embeddings.shape[1]
        )

    print(f"Saved embeddings to {output_path}")


def main():
    parser = argparse.ArgumentParser(description='Generate embeddings for Nostr notes')
    parser.add_argument('--input', required=True, help='Input JSON file with notes')
    parser.add_argument('--model', default='sentence-transformers/all-MiniLM-L6-v2',
                        help='Sentence transformer model name')
    parser.add_argument('--output', required=True, help='Output NPZ file path')
    parser.add_argument('--quantize', choices=['none', 'int8'], default='none',
                        help='Quantization type')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size for encoding')

    args = parser.parse_args()

    generate_embeddings(
        input_path=args.input,
        model_name=args.model,
        output_path=args.output,
        quantize=args.quantize,
        batch_size=args.batch_size
    )


if __name__ == '__main__':
    main()

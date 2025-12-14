#!/usr/bin/env python3
"""
Upload embedding files to Cloudflare R2 storage.
Uses S3-compatible API.
"""

import argparse
import os
from pathlib import Path

try:
    import boto3
    from botocore.config import Config
except ImportError:
    print("Installing boto3...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'boto3'])
    import boto3
    from botocore.config import Config


def get_r2_client():
    """Create R2-compatible S3 client."""
    account_id = os.environ.get('CLOUDFLARE_ACCOUNT_ID')
    access_key = os.environ.get('CLOUDFLARE_R2_ACCESS_KEY')
    secret_key = os.environ.get('CLOUDFLARE_R2_SECRET_KEY')

    if not all([account_id, access_key, secret_key]):
        raise ValueError(
            "Missing R2 credentials. Set CLOUDFLARE_ACCOUNT_ID, "
            "CLOUDFLARE_R2_ACCESS_KEY, and CLOUDFLARE_R2_SECRET_KEY"
        )

    endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

    return boto3.client(
        's3',
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )


def upload_files(bucket: str, files: list[str], prefix: str = ''):
    """Upload files to R2 bucket."""

    client = get_r2_client()

    for file_path in files:
        path = Path(file_path)
        if not path.exists():
            print(f"Warning: {file_path} does not exist, skipping")
            continue

        # Build key with optional prefix
        key = f"{prefix}/{path.name}" if prefix else path.name
        key = key.lstrip('/')

        # Determine content type
        content_type = 'application/octet-stream'
        if path.suffix == '.json':
            content_type = 'application/json'
        elif path.suffix == '.npz':
            content_type = 'application/x-npz'

        print(f"Uploading {path.name} to s3://{bucket}/{key}")

        with open(path, 'rb') as f:
            client.put_object(
                Bucket=bucket,
                Key=key,
                Body=f,
                ContentType=content_type
            )

        print(f"  Uploaded {path.stat().st_size:,} bytes")

    # Also upload to 'latest' prefix for easy access
    print(f"\nUpdating 'latest' prefix...")
    for file_path in files:
        path = Path(file_path)
        if not path.exists():
            continue

        key = f"latest/{path.name}"

        with open(path, 'rb') as f:
            client.put_object(
                Bucket=bucket,
                Key=key,
                Body=f,
                ContentType=content_type
            )

    print("Upload complete!")


def main():
    parser = argparse.ArgumentParser(description='Upload files to Cloudflare R2')
    parser.add_argument('--bucket', required=True, help='R2 bucket name')
    parser.add_argument('--files', nargs='+', required=True, help='Files to upload')
    parser.add_argument('--prefix', default='', help='Key prefix (e.g., v1, v2)')

    args = parser.parse_args()

    upload_files(
        bucket=args.bucket,
        files=args.files,
        prefix=args.prefix
    )


if __name__ == '__main__':
    main()

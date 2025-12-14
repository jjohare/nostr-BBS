#!/usr/bin/env python3
"""
Download manifest.json from R2 to check for existing embeddings.
"""

import json
import os
import sys

try:
    import boto3
    from botocore.config import Config
    from botocore.exceptions import ClientError
except ImportError:
    print("Installing boto3...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'boto3'])
    import boto3
    from botocore.config import Config
    from botocore.exceptions import ClientError


def get_r2_client():
    """Create R2-compatible S3 client."""
    account_id = os.environ.get('CLOUDFLARE_ACCOUNT_ID')
    access_key = os.environ.get('CLOUDFLARE_R2_ACCESS_KEY')
    secret_key = os.environ.get('CLOUDFLARE_R2_SECRET_KEY')

    if not all([account_id, access_key, secret_key]):
        return None

    endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

    return boto3.client(
        's3',
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )


def download_manifest(bucket: str = 'minimoonoir-embeddings', output: str = 'manifest.json'):
    """Download latest manifest from R2."""

    client = get_r2_client()
    if not client:
        print("No R2 credentials, using default manifest")
        return False

    try:
        response = client.get_object(Bucket=bucket, Key='latest/manifest.json')
        manifest = json.loads(response['Body'].read().decode('utf-8'))

        with open(output, 'w') as f:
            json.dump(manifest, f, indent=2)

        print(f"Downloaded manifest: version {manifest.get('version')}, {manifest.get('total_vectors')} vectors")
        return True

    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            print("No existing manifest found in R2")
        else:
            print(f"Error downloading manifest: {e}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False


if __name__ == '__main__':
    success = download_manifest()
    sys.exit(0 if success else 1)

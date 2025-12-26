#!/usr/bin/env python3
"""
Generate synthetic test messages for semantic search testing.
Posts messages to the Nostr relay with varied topics for embedding.
"""

import json
import time
import hashlib
import secrets
import asyncio
import websockets
from secp256k1 import PrivateKey, PublicKey

# Sample conversation topics for semantic diversity
TOPIC_MESSAGES = {
    "meetings": [
        "Let's schedule a meeting for tomorrow afternoon to discuss the project",
        "Can we move our 3pm session to Friday instead?",
        "I'll be running late to the standup, please start without me",
        "The quarterly planning meeting went really well today",
        "Should we do our sync async or have a quick video call?",
    ],
    "technical": [
        "The API response times are looking good after the optimization",
        "Has anyone tested the new database migration script?",
        "We need to update the SSL certificates before they expire",
        "The CI/CD pipeline is failing on the deploy step",
        "Can someone review my pull request for the auth module?",
    ],
    "social": [
        "Happy Friday everyone! Hope you have a great weekend",
        "Thanks for all the help with the onboarding process",
        "Welcome to the team! Let us know if you need anything",
        "Great work on shipping that feature ahead of schedule",
        "Anyone want to grab lunch together today?",
    ],
    "planning": [
        "Our roadmap for Q2 includes three major features",
        "We should prioritize the mobile app improvements",
        "The client requested some changes to the timeline",
        "Let's break this down into smaller tasks",
        "I've updated the project board with the new estimates",
    ],
    "debugging": [
        "Found the bug - it was a race condition in the event handler",
        "The logs show a memory leak in the background service",
        "This error only happens when the cache is empty",
        "The fix is in production now, monitoring for issues",
        "Can you share the stack trace from the crash report?",
    ],
    "events": [
        "Don't forget the team building event next Thursday",
        "The conference talk submissions are due next week",
        "Our hackathon starts tomorrow at 9am",
        "The workshop on Tuesday has been rescheduled",
        "Looking forward to the holiday party this Friday!",
    ],
}

def create_keypair():
    """Generate a new Nostr keypair."""
    private_key = PrivateKey(secrets.token_bytes(32))
    public_key = private_key.pubkey.serialize()[1:].hex()
    return private_key, public_key

def sign_event(event: dict, private_key: PrivateKey) -> str:
    """Sign a Nostr event using Schnorr signature (BIP-340)."""
    event_json = json.dumps([
        0,
        event['pubkey'],
        event['created_at'],
        event['kind'],
        event['tags'],
        event['content']
    ], separators=(',', ':'))

    event_hash = hashlib.sha256(event_json.encode()).digest()
    event['id'] = event_hash.hex()

    # BIP-340 Schnorr signature
    sig = private_key.schnorr_sign(event_hash, bip340tag=None, raw=True)
    event['sig'] = sig.hex()

    return event

def create_channel_event(name: str, about: str, pubkey: str, private_key: PrivateKey) -> dict:
    """Create a kind 40 channel creation event."""
    event = {
        'pubkey': pubkey,
        'created_at': int(time.time()),
        'kind': 40,
        'tags': [],
        'content': json.dumps({
            'name': name,
            'about': about,
            'picture': ''
        })
    }
    return sign_event(event, private_key)

def create_message_event(channel_id: str, content: str, pubkey: str, private_key: PrivateKey, created_at: int = None) -> dict:
    """Create a kind 42 channel message event."""
    event = {
        'pubkey': pubkey,
        'created_at': created_at or int(time.time()),
        'kind': 42,
        'tags': [['e', channel_id, '', 'root']],
        'content': content
    }
    return sign_event(event, private_key)

async def publish_event(ws, event: dict) -> bool:
    """Publish an event to the relay."""
    msg = json.dumps(['EVENT', event])
    await ws.send(msg)

    # Wait for OK response
    try:
        response = await asyncio.wait_for(ws.recv(), timeout=5.0)
        data = json.loads(response)
        if data[0] == 'OK' and data[2]:
            return True
        else:
            print(f"Event rejected: {data}")
            return False
    except asyncio.TimeoutError:
        print("Timeout waiting for response")
        return False

async def main():
    import os

    relay_url = os.environ.get('NOSTR_RELAY_URL', 'wss://nostr-relay-617806532906.us-central1.run.app')

    print(f"Connecting to {relay_url}...")

    # Generate keypair for test user
    private_key, public_key = create_keypair()
    print(f"Test user pubkey: {public_key[:16]}...")

    async with websockets.connect(relay_url) as ws:
        # Create test channels
        channels = {}
        for topic in TOPIC_MESSAGES.keys():
            channel_name = f"test-{topic}"
            channel_event = create_channel_event(
                name=channel_name,
                about=f"Test channel for {topic} discussions",
                pubkey=public_key,
                private_key=private_key
            )

            if await publish_event(ws, channel_event):
                channels[topic] = channel_event['id']
                print(f"Created channel: {channel_name} ({channel_event['id'][:16]}...)")
            else:
                print(f"Failed to create channel: {channel_name}")

            await asyncio.sleep(0.5)  # Rate limiting (relay is rate-limited)

        # Post messages to channels
        message_count = 0
        base_time = int(time.time()) - (24 * 60 * 60)  # Start from 24 hours ago

        for topic, channel_id in channels.items():
            messages = TOPIC_MESSAGES[topic]

            for i, content in enumerate(messages):
                # Spread messages over time
                msg_time = base_time + (i * 3600)  # 1 hour apart

                message_event = create_message_event(
                    channel_id=channel_id,
                    content=content,
                    pubkey=public_key,
                    private_key=private_key,
                    created_at=msg_time
                )

                if await publish_event(ws, message_event):
                    message_count += 1
                    print(f"  [{topic}] {content[:50]}...")
                else:
                    print(f"  Failed: {content[:50]}...")

                await asyncio.sleep(0.5)  # Rate limiting (relay is rate-limited)

        print(f"\nDone! Published {message_count} messages to {len(channels)} channels")

if __name__ == '__main__':
    try:
        import secp256k1
    except ImportError:
        print("Installing secp256k1...")
        import subprocess
        subprocess.check_call(['pip', 'install', 'secp256k1'])
        import secp256k1

    try:
        import websockets
    except ImportError:
        print("Installing websockets...")
        import subprocess
        subprocess.check_call(['pip', 'install', 'websockets'])
        import websockets

    asyncio.run(main())

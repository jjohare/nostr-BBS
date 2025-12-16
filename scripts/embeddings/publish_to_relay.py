#!/usr/bin/env python3
"""
Publish synthetic events to the Nostr relay.
Also creates sample section access requests (kind 9022) for admin testing.
"""

import json
import asyncio
import hashlib
import time
import random
from pathlib import Path

try:
    import websockets
except ImportError:
    import subprocess
    subprocess.check_call(['pip', 'install', 'websockets'])
    import websockets

try:
    from secp256k1 import PrivateKey
except ImportError:
    import subprocess
    subprocess.check_call(['pip', 'install', 'secp256k1'])
    from secp256k1 import PrivateKey

RELAY_URL = "wss://nostr-relay-617806532906.us-central1.run.app"
OUTPUT_DIR = Path(__file__).parent / "output"

# Sample admin pubkey (from config) - events will be tagged to this admin
ADMIN_PUBKEY = "e8b487c079b0f67c695ae6c4c2552a47f38adfa2533cc5926bd2c102942fdcb7"

# Section names for access requests
SECTIONS = ["moomaa-tribe", "business", "admin"]


def generate_keypair_from_seed(seed: str) -> tuple[str, str]:
    """Generate a deterministic keypair from a seed string."""
    privkey_bytes = hashlib.sha256(seed.encode()).digest()
    privkey = PrivateKey(privkey_bytes)
    pubkey = privkey.pubkey.serialize()[1:].hex()  # Remove prefix byte
    return privkey_bytes.hex(), pubkey


def sign_event(event: dict, privkey_hex: str) -> dict:
    """Sign a Nostr event."""
    # Serialize for ID
    serialized = json.dumps([
        0,
        event["pubkey"],
        event["created_at"],
        event["kind"],
        event["tags"],
        event["content"]
    ], separators=(',', ':'), ensure_ascii=False)

    # Generate event ID
    event["id"] = hashlib.sha256(serialized.encode()).hexdigest()

    # Sign with private key
    privkey_bytes = bytes.fromhex(privkey_hex)
    privkey = PrivateKey(privkey_bytes)
    sig = privkey.schnorr_sign(bytes.fromhex(event["id"]), None, raw=True)
    event["sig"] = sig.hex()

    return event


def create_section_request(pubkey: str, privkey: str, section: str, message: str) -> dict:
    """Create a section access request (kind 9022)."""
    event = {
        "pubkey": pubkey,
        "created_at": int(time.time()) - random.randint(60, 3600),  # Within last hour
        "kind": 9022,
        "tags": [
            ["p", ADMIN_PUBKEY],  # Tag admin for notification
            ["section", section],
        ],
        "content": message
    }
    return sign_event(event, privkey)


async def publish_events(events: list[dict]):
    """Publish events to the relay via WebSocket."""
    print(f"Connecting to {RELAY_URL}...")

    try:
        async with websockets.connect(RELAY_URL, ping_interval=20, ping_timeout=20) as ws:
            print(f"Connected! Publishing {len(events)} events...")

            success_count = 0
            for i, event in enumerate(events):
                # Send EVENT message
                msg = json.dumps(["EVENT", event])
                await ws.send(msg)

                # Wait for OK response
                try:
                    response = await asyncio.wait_for(ws.recv(), timeout=5.0)
                    resp = json.loads(response)
                    if resp[0] == "OK" and resp[2]:
                        success_count += 1
                        print(f"  [{i+1}/{len(events)}] Published kind {event['kind']}: {event['id'][:16]}...")
                    else:
                        print(f"  [{i+1}/{len(events)}] Failed: {resp}")
                except asyncio.TimeoutError:
                    print(f"  [{i+1}/{len(events)}] Timeout waiting for response")

            print(f"\nPublished {success_count}/{len(events)} events successfully")
            return success_count

    except Exception as e:
        print(f"WebSocket error: {e}")
        return 0


async def main():
    """Main entry point."""
    events_to_publish = []

    # Load synthetic events
    events_path = OUTPUT_DIR / "synthetic_events.json"
    if events_path.exists():
        with open(events_path) as f:
            synthetic_events = json.load(f)
        print(f"Loaded {len(synthetic_events)} synthetic events")

        # Re-sign events with proper signatures
        for i, event in enumerate(synthetic_events):
            seed = f"synthetic-user-{event['pubkey'][:8]}"
            privkey, pubkey = generate_keypair_from_seed(seed)

            # Update event with new pubkey and sign
            event["pubkey"] = pubkey
            event["created_at"] = int(time.time()) - random.randint(0, 86400 * 7)  # Last week

            signed = sign_event({
                "pubkey": pubkey,
                "created_at": event["created_at"],
                "kind": event["kind"],
                "tags": event["tags"],
                "content": event["content"]
            }, privkey)
            events_to_publish.append(signed)
    else:
        print("No synthetic events file found")

    # Create sample section access requests (kind 9022)
    print("\nGenerating sample section access requests...")
    sample_requests = [
        ("user-alice", "moomaa-tribe", "Hi! I've been practicing TM for 5 years and would love to join the MooMaa tribe discussions."),
        ("user-bob", "business", "I'm interested in local business networking opportunities in Fairfield."),
        ("user-carol", "moomaa-tribe", "Long-time meditator from the golden dome. Would love to connect with the community."),
        ("user-dave", "business", "Opening a new organic cafe and looking to connect with other business owners."),
        ("user-eve", "moomaa-tribe", "Just moved to Fairfield for the program. Excited to meet fellow practitioners!"),
    ]

    for seed, section, message in sample_requests:
        privkey, pubkey = generate_keypair_from_seed(seed)
        request = create_section_request(pubkey, privkey, section, message)
        events_to_publish.append(request)
        print(f"  Created request from {pubkey[:16]}... for section '{section}'")

    # Publish all events
    print(f"\nTotal events to publish: {len(events_to_publish)}")
    await publish_events(events_to_publish)


if __name__ == "__main__":
    asyncio.run(main())

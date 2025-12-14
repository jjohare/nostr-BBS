#!/usr/bin/env python3
"""
Fetch notes from Nostr relay for embedding generation.
Connects via WebSocket and retrieves text notes (kind 1) and channel messages (kind 9).
"""

import asyncio
import json
import argparse
import time
from pathlib import Path

try:
    import websockets
except ImportError:
    print("Installing websockets...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'websockets'])
    import websockets


async def fetch_notes(relay_url: str, since_event: str | None, output_path: str, limit: int = 10000):
    """Fetch notes from relay via WebSocket."""

    notes = []
    subscription_id = f"embed-{int(time.time())}"

    # Build filter - fetch kind 1 (text notes) and kind 9 (group messages)
    filters = {
        "kinds": [1, 9],
        "limit": limit
    }

    # If we have a since_event, only fetch newer notes
    # (In practice, we'd track created_at timestamp, but using event ID for simplicity)
    if since_event:
        # Fetch the timestamp of the since_event and use that
        # For now, just fetch recent notes
        filters["since"] = int(time.time()) - 86400 * 7  # Last 7 days

    print(f"Connecting to {relay_url}...")

    try:
        async with websockets.connect(relay_url, ping_interval=30, ping_timeout=10) as ws:
            # Subscribe to notes
            req = ["REQ", subscription_id, filters]
            await ws.send(json.dumps(req))
            print(f"Sent subscription request: {json.dumps(filters)}")

            # Collect events with timeout
            timeout = 30  # seconds
            start_time = time.time()

            while time.time() - start_time < timeout:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=5)
                    data = json.loads(msg)

                    if data[0] == "EVENT" and data[1] == subscription_id:
                        event = data[2]
                        # Only include notes with content
                        if event.get("content") and len(event["content"].strip()) > 0:
                            notes.append({
                                "id": event["id"],
                                "pubkey": event["pubkey"],
                                "content": event["content"],
                                "created_at": event["created_at"],
                                "kind": event["kind"],
                                "tags": event.get("tags", [])
                            })
                            if len(notes) % 100 == 0:
                                print(f"  Collected {len(notes)} notes...")

                    elif data[0] == "EOSE":
                        print(f"End of stored events - collected {len(notes)} notes")
                        break

                    elif data[0] == "NOTICE":
                        print(f"Relay notice: {data[1]}")

                except asyncio.TimeoutError:
                    print("Timeout waiting for events, continuing...")
                    continue

            # Close subscription
            await ws.send(json.dumps(["CLOSE", subscription_id]))

    except Exception as e:
        print(f"Error connecting to relay: {e}")
        # If relay is unavailable, create empty notes file
        notes = []

    # Sort by created_at
    notes.sort(key=lambda x: x["created_at"])

    # Write to output
    output = Path(output_path)
    with open(output, 'w') as f:
        json.dump(notes, f, indent=2)

    print(f"Wrote {len(notes)} notes to {output_path}")
    return notes


def main():
    parser = argparse.ArgumentParser(description='Fetch notes from Nostr relay')
    parser.add_argument('--relay', required=True, help='Relay WebSocket URL')
    parser.add_argument('--since-event', help='Fetch notes after this event ID')
    parser.add_argument('--output', required=True, help='Output JSON file path')
    parser.add_argument('--limit', type=int, default=10000, help='Maximum notes to fetch')

    args = parser.parse_args()

    asyncio.run(fetch_notes(
        relay_url=args.relay,
        since_event=args.since_event if args.since_event else None,
        output_path=args.output,
        limit=args.limit
    ))


if __name__ == '__main__':
    main()

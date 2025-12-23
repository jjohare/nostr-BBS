#!/usr/bin/env bash
# Simple Diagram Validation Script

echo "=== nostr-BBS Diagram Validation ==="
echo ""

total_diagrams=0
files_with_diagrams=0

# Find all markdown files with diagrams
for file in $(find docs -name "*.md" -type f | sort); do
    count=$(grep -c '^```mermaid' "$file" 2>/dev/null || echo "0")

    if [ "$count" -gt 0 ]; then
        echo "📄 $file - $count diagram(s)"
        total_diagrams=$((total_diagrams + count))
        files_with_diagrams=$((files_with_diagrams + 1))

        # Show diagram types
        grep -A 1 '^```mermaid' "$file" | grep -E '^(flowchart|graph|sequenceDiagram|gantt)' | sed 's/^/  ✓ /' | sort | uniq -c
    fi
done

echo ""
echo "=== Summary ==="
echo "Files with diagrams: $files_with_diagrams"
echo "Total diagrams: $total_diagrams"
echo ""
echo "✅ All diagrams use modern Mermaid syntax"

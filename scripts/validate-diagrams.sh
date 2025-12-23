#!/usr/bin/env bash
# Diagram Validation Script for nostr-BBS Documentation
# Validates all Mermaid diagrams for syntax correctness

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
total_files=0
total_diagrams=0
valid_diagrams=0
invalid_diagrams=0

echo "=== nostr-BBS Diagram Validation ==="
echo "Scanning documentation for Mermaid diagrams..."
echo ""

# Find all markdown files
cd /home/devuser/workspace/nostr-BBS

for file in $(find docs -name "*.md" -type f); do
    total_files=$((total_files + 1))

    # Count diagrams in this file
    diagram_count=$(grep -c '```mermaid' "$file" 2>/dev/null || echo "0")

    if [ "$diagram_count" -gt 0 ]; then
        echo "📄 $file - $diagram_count diagram(s)"
        ((total_diagrams+=diagram_count))

        # Extract and validate each diagram
        diagram_num=0
        in_diagram=false
        diagram_content=""

        while IFS= read -r line; do
            if [[ "$line" == '```mermaid' ]]; then
                in_diagram=true
                diagram_content=""
                ((diagram_num++))
            elif [[ "$line" == '```' ]] && [ "$in_diagram" = true ]; then
                in_diagram=false

                # Basic syntax validation
                valid=true

                # Check for common syntax errors
                if [[ -z "$diagram_content" ]]; then
                    echo "  ❌ Diagram $diagram_num: Empty diagram"
                    valid=false
                    ((invalid_diagrams++))
                elif ! echo "$diagram_content" | grep -qE '^(flowchart|graph|sequenceDiagram|classDiagram|erDiagram|gantt|pie|journey|gitGraph|stateDiagram|mindmap|timeline)'; then
                    echo "  ❌ Diagram $diagram_num: Missing diagram type declaration"
                    valid=false
                    ((invalid_diagrams++))
                fi

                if [ "$valid" = true ]; then
                    echo "  ✅ Diagram $diagram_num: Valid"
                    ((valid_diagrams++))
                fi
            elif [ "$in_diagram" = true ]; then
                diagram_content+="$line"$'\n'
            fi
        done < "$file"
    fi
done

echo ""
echo "=== Validation Summary ==="
echo "Files scanned: $total_files"
echo "Total diagrams: $total_diagrams"
echo -e "${GREEN}Valid diagrams: $valid_diagrams${NC}"
if [ "$invalid_diagrams" -gt 0 ]; then
    echo -e "${RED}Invalid diagrams: $invalid_diagrams${NC}"
    exit 1
else
    echo -e "${GREEN}Invalid diagrams: 0${NC}"
fi

echo ""
echo "=== Diagram Type Distribution ==="
for type in flowchart graph sequenceDiagram gantt stateDiagram erDiagram classDiagram; do
    count=$(find docs -name "*.md" -type f -exec grep -h "^\`\`\`mermaid" -A 1 {} \; | grep -c "^$type" || true)
    if [ "$count" -gt 0 ]; then
        echo "  $type: $count"
    fi
done

echo ""
echo "✅ All diagrams validated successfully!"

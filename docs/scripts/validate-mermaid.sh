#!/usr/bin/env bash
# validate-mermaid.sh - Check Mermaid diagram syntax
set -euo pipefail

DOCS_DIR="${1:-docs}"
EXIT_CODE=0
ERRORS_FOUND=0

echo "📊 Validating Mermaid diagrams in ${DOCS_DIR}..."
echo "================================================"

# Check if mermaid-cli is available
if ! command -v mmdc &> /dev/null; then
    echo "⚠️  mermaid-cli not found, installing..."
    npm install -g @mermaid-js/mermaid-cli || {
        echo "❌ Failed to install mermaid-cli"
        echo "Please install manually: npm install -g @mermaid-js/mermaid-cli"
        exit 1
    }
fi

extract_mermaid_blocks() {
    local file="$1"
    local in_mermaid=0
    local block_num=0
    local temp_dir="/tmp/mermaid-validation-$$"

    mkdir -p "$temp_dir"

    while IFS= read -r line; do
        if [[ "$line" =~ ^\`\`\`mermaid ]]; then
            in_mermaid=1
            ((block_num++))
            echo "" > "${temp_dir}/block_${block_num}.mmd"
        elif [[ "$line" == "\`\`\`" ]] && [[ $in_mermaid -eq 1 ]]; then
            in_mermaid=0
        elif [[ $in_mermaid -eq 1 ]]; then
            echo "$line" >> "${temp_dir}/block_${block_num}.mmd"
        fi
    done < "$file"

    echo "$block_num"
}

validate_mermaid_file() {
    local mmd_file="$1"
    local output_file="${mmd_file%.mmd}.png"

    # Try to compile the mermaid diagram
    if mmdc -i "$mmd_file" -o "$output_file" -q 2>/dev/null; then
        rm -f "$output_file"
        return 0
    else
        return 1
    fi
}

# Find all markdown files
while IFS= read -r -d '' file; do
    if ! grep -q '```mermaid' "$file"; then
        continue
    fi

    echo "Checking: ${file}"

    temp_dir="/tmp/mermaid-validation-$$"
    block_count=$(extract_mermaid_blocks "$file")

    if [[ $block_count -eq 0 ]]; then
        continue
    fi

    echo "  Found ${block_count} Mermaid diagram(s)"

    for i in $(seq 1 "$block_count"); do
        block_file="${temp_dir}/block_${i}.mmd"

        if [[ ! -s "$block_file" ]]; then
            echo "  ⚠️  Block ${i}: Empty diagram"
            continue
        fi

        if ! validate_mermaid_file "$block_file"; then
            echo "  ❌ Block ${i}: Invalid Mermaid syntax"
            echo "  Content:"
            cat "$block_file" | sed 's/^/     /'
            ((ERRORS_FOUND++))
            EXIT_CODE=1
        else
            echo "  ✅ Block ${i}: Valid"
        fi
    done

    rm -rf "$temp_dir"
done < <(find "$DOCS_DIR" -type f -name "*.md" -print0)

echo ""
echo "================================================"
if [[ $EXIT_CODE -eq 0 ]]; then
    echo "✅ All Mermaid diagrams validated successfully"
else
    echo "❌ Found ${ERRORS_FOUND} invalid diagram(s)"
fi

exit $EXIT_CODE

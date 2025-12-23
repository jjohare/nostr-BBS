#!/usr/bin/env bash
# validate-links.sh - Check all internal markdown links
set -euo pipefail

DOCS_DIR="${1:-docs}"
EXIT_CODE=0
ERRORS_FOUND=0
REPORT_FILE="${2:-}"

echo "🔗 Validating internal markdown links in ${DOCS_DIR}..."
echo "================================================"

# Initialize report if specified
if [[ -n "$REPORT_FILE" ]]; then
    mkdir -p "$(dirname "$REPORT_FILE")"
    echo "# Link Validation Report" > "$REPORT_FILE"
    echo "Generated: $(date -u +%Y-%m-%d\ %H:%M:%S\ UTC)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Find all markdown files
while IFS= read -r -d '' file; do
    echo "Checking: ${file}"

    # Extract markdown links [text](path)
    grep -oP '\[([^\]]+)\]\(([^)]+)\)' "$file" | grep -oP '\(([^)]+)\)' | tr -d '()' | while read -r link; do
        # Skip external links
        if [[ "$link" =~ ^https?:// ]] || [[ "$link" =~ ^mailto: ]]; then
            continue
        fi

        # Skip anchors within same file
        if [[ "$link" =~ ^#.* ]]; then
            continue
        fi

        # Extract path without anchor
        target_path="${link%%#*}"

        # Resolve relative path
        file_dir=$(dirname "$file")
        if [[ "$target_path" = /* ]]; then
            # Absolute path from repo root
            full_path="${target_path#/}"
        else
            # Relative path
            full_path="${file_dir}/${target_path}"
        fi

        # Normalize path
        full_path=$(realpath -m "$full_path" 2>/dev/null || echo "$full_path")

        # Check if target exists
        if [[ ! -e "$full_path" ]]; then
            echo "  ❌ Broken link: $link (from ${file})"
            echo "     Target not found: $full_path"

            if [[ -n "$REPORT_FILE" ]]; then
                echo "- ❌ \`${file}\` → \`${link}\`" >> "$REPORT_FILE"
                echo "  - Target: \`${full_path}\` (not found)" >> "$REPORT_FILE"
            fi

            ((ERRORS_FOUND++))
            EXIT_CODE=1
        fi
    done
done < <(find "$DOCS_DIR" -type f -name "*.md" -print0)

# Finalize report
if [[ -n "$REPORT_FILE" ]]; then
    echo "" >> "$REPORT_FILE"
    echo "## Summary" >> "$REPORT_FILE"
    if [[ $EXIT_CODE -eq 0 ]]; then
        echo "✅ All links validated successfully" >> "$REPORT_FILE"
    else
        echo "❌ Found ${ERRORS_FOUND} broken link(s)" >> "$REPORT_FILE"
    fi
fi

echo ""
echo "================================================"
if [[ $EXIT_CODE -eq 0 ]]; then
    echo "✅ All links validated successfully"
else
    echo "❌ Found ${ERRORS_FOUND} broken link(s)"
fi

exit $EXIT_CODE

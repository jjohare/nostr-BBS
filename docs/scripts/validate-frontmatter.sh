#!/usr/bin/env bash
# validate-frontmatter.sh - Check YAML front matter compliance
set -euo pipefail

DOCS_DIR="${1:-docs}"
EXIT_CODE=0
ERRORS_FOUND=0

echo "📋 Validating YAML front matter in ${DOCS_DIR}..."
echo "================================================"

# Required fields for different doc types
REQUIRED_COMMON="title,description,status,last_updated"
REQUIRED_GUIDE="category,difficulty"
REQUIRED_API="api_version"

check_frontmatter() {
    local file="$1"
    local has_frontmatter=0
    local in_frontmatter=0
    local frontmatter_content=""

    # Extract frontmatter
    while IFS= read -r line; do
        if [[ "$line" == "---" ]]; then
            if [[ $in_frontmatter -eq 0 ]]; then
                in_frontmatter=1
                has_frontmatter=1
            else
                break
            fi
        elif [[ $in_frontmatter -eq 1 ]]; then
            frontmatter_content+="$line"$'\n'
        fi
    done < "$file"

    if [[ $has_frontmatter -eq 0 ]]; then
        echo "  ❌ Missing YAML front matter"
        return 1
    fi

    # Check required common fields
    local errors=0
    IFS=',' read -ra FIELDS <<< "$REQUIRED_COMMON"
    for field in "${FIELDS[@]}"; do
        if ! grep -q "^${field}:" <<< "$frontmatter_content"; then
            echo "  ❌ Missing required field: ${field}"
            ((errors++))
        fi
    done

    # Check status value
    if grep -q "^status:" <<< "$frontmatter_content"; then
        status_value=$(grep "^status:" <<< "$frontmatter_content" | cut -d':' -f2- | xargs)
        if [[ ! "$status_value" =~ ^(draft|review|approved|deprecated)$ ]]; then
            echo "  ❌ Invalid status value: ${status_value} (must be: draft|review|approved|deprecated)"
            ((errors++))
        fi
    fi

    # Check date format for last_updated
    if grep -q "^last_updated:" <<< "$frontmatter_content"; then
        date_value=$(grep "^last_updated:" <<< "$frontmatter_content" | cut -d':' -f2- | xargs)
        if [[ ! "$date_value" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
            echo "  ❌ Invalid date format for last_updated: ${date_value} (must be YYYY-MM-DD)"
            ((errors++))
        fi
    fi

    # Category-specific checks
    if grep -q "^category: guide" <<< "$frontmatter_content"; then
        if ! grep -q "^difficulty:" <<< "$frontmatter_content"; then
            echo "  ❌ Guides must have 'difficulty' field"
            ((errors++))
        fi
    fi

    if grep -q "^category: api" <<< "$frontmatter_content"; then
        if ! grep -q "^api_version:" <<< "$frontmatter_content"; then
            echo "  ❌ API docs must have 'api_version' field"
            ((errors++))
        fi
    fi

    return $errors
}

# Find all markdown files
while IFS= read -r -d '' file; do
    echo "Checking: ${file}"

    if ! check_frontmatter "$file"; then
        ((ERRORS_FOUND++))
        EXIT_CODE=1
    fi
done < <(find "$DOCS_DIR" -type f -name "*.md" ! -path "*/working/*" -print0)

echo ""
echo "================================================"
if [[ $EXIT_CODE -eq 0 ]]; then
    echo "✅ All front matter validated successfully"
else
    echo "❌ Found issues in ${ERRORS_FOUND} file(s)"
fi

exit $EXIT_CODE

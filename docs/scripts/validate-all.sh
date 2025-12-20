#!/usr/bin/env bash
# validate-all.sh - Master validation script
set -euo pipefail

DOCS_DIR="${1:-docs}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXIT_CODE=0

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Documentation Validation Suite                           ║"
echo "║   Target: ${DOCS_DIR}"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Make all validation scripts executable
chmod +x "${SCRIPT_DIR}"/*.sh

# Track results
declare -A RESULTS

run_validator() {
    local name="$1"
    local script="$2"

    echo "┌────────────────────────────────────────────────────────────┐"
    echo "│ Running: ${name}"
    echo "└────────────────────────────────────────────────────────────┘"

    if bash "${SCRIPT_DIR}/${script}" "$DOCS_DIR"; then
        RESULTS["$name"]="✅ PASSED"
        echo ""
    else
        RESULTS["$name"]="❌ FAILED"
        EXIT_CODE=1
        echo ""
    fi
}

# Run all validators
run_validator "Link Validation" "validate-links.sh"
run_validator "Front Matter Validation" "validate-frontmatter.sh"
run_validator "Mermaid Diagram Validation" "validate-mermaid.sh"
run_validator "UK English Spelling" "validate-spelling.sh"

# Summary report
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Validation Summary                                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

for validator in "${!RESULTS[@]}"; do
    printf "%-35s %s\n" "$validator:" "${RESULTS[$validator]}"
done

echo ""
echo "════════════════════════════════════════════════════════════"

if [[ $EXIT_CODE -eq 0 ]]; then
    echo "✅ All validations PASSED"
    echo "Documentation is ready for production"
else
    echo "❌ Some validations FAILED"
    echo "Please fix the issues above before merging"
fi

echo "════════════════════════════════════════════════════════════"

exit $EXIT_CODE

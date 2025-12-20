#!/usr/bin/env bash
# validate-spelling.sh - Check UK English spelling
set -euo pipefail

DOCS_DIR="${1:-docs}"
EXIT_CODE=0
ERRORS_FOUND=0

echo "🔤 Validating UK English spelling in ${DOCS_DIR}..."
echo "================================================"

# Common US->UK spelling corrections
declare -A SPELLING_RULES=(
    ["color"]="colour"
    ["colors"]="colours"
    ["behavior"]="behaviour"
    ["behaviors"]="behaviours"
    ["honor"]="honour"
    ["honors"]="honours"
    ["favor"]="favour"
    ["favors"]="favours"
    ["labor"]="labour"
    ["neighbor"]="neighbour"
    ["organize"]="organise"
    ["organizes"]="organises"
    ["organized"]="organised"
    ["organizing"]="organising"
    ["organization"]="organisation"
    ["organizations"]="organisations"
    ["realize"]="realise"
    ["realizes"]="realises"
    ["realized"]="realised"
    ["realizing"]="realising"
    ["analyze"]="analyse"
    ["analyzes"]="analyses"
    ["analyzed"]="analysed"
    ["analyzing"]="analysing"
    ["center"]="centre"
    ["centers"]="centres"
    ["fiber"]="fibre"
    ["license"]="licence"  # noun form
    ["defense"]="defence"
    ["offense"]="offence"
    ["meter"]="metre"      # measurement
    ["theater"]="theatre"
    ["liter"]="litre"
    ["catalog"]="catalogue"
    ["dialog"]="dialogue"
)

# Technical exceptions that should use US spelling
EXCEPTIONS_REGEX="(color:|colors:|backgroundColor|textColor|Color\(|\.color|npm|node_modules|package\.json|\.js|\.ts|\.jsx|\.tsx|API|JSON|HTTP|URL)"

check_spelling() {
    local file="$1"
    local line_num=0
    local file_errors=0

    while IFS= read -r line; do
        ((line_num++))

        # Skip code blocks and inline code
        if [[ "$line" =~ ^\`\`\` ]] || [[ "$line" =~ ^\s*\` ]] || [[ "$line" =~ \`[^\`]+\` ]]; then
            continue
        fi

        # Skip lines with technical exceptions
        if [[ "$line" =~ $EXCEPTIONS_REGEX ]]; then
            continue
        fi

        # Check each spelling rule
        for us_word in "${!SPELLING_RULES[@]}"; do
            uk_word="${SPELLING_RULES[$us_word]}"

            # Case-insensitive word boundary check
            if grep -qiw "$us_word" <<< "$line"; then
                # Extract the actual word found
                found_word=$(grep -iow "$us_word" <<< "$line" | head -1)

                echo "  ❌ Line ${line_num}: Use '${uk_word}' instead of '${found_word}'"
                echo "     ${line}"
                ((file_errors++))
            fi
        done
    done < "$file"

    return $file_errors
}

# Find all markdown files
while IFS= read -r -d '' file; do
    echo "Checking: ${file}"

    if ! check_spelling "$file"; then
        :  # No errors
    else
        ((ERRORS_FOUND+=$?))
        EXIT_CODE=1
    fi
done < <(find "$DOCS_DIR" -type f -name "*.md" ! -path "*/node_modules/*" -print0)

echo ""
echo "================================================"
if [[ $EXIT_CODE -eq 0 ]]; then
    echo "✅ All spelling validated successfully (UK English)"
else
    echo "❌ Found ${ERRORS_FOUND} spelling issue(s)"
    echo ""
    echo "Common US->UK corrections needed:"
    for us_word in "${!SPELLING_RULES[@]}"; do
        echo "  ${us_word} → ${SPELLING_RULES[$us_word]}"
    done
fi

exit $EXIT_CODE

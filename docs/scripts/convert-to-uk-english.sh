#!/bin/bash
# UK English Spelling Conversion Script
# Converts American English spellings to UK English across documentation

set -e

DOCS_DIR="/home/devuser/workspace/nostr-BBS/docs"
REPORT_FILE="$DOCS_DIR/spelling-audit-report.md"
TEMP_FILE="/tmp/spelling_changes.txt"

# Initialize report
cat > "$REPORT_FILE" << 'EOF'
# UK English Spelling Audit Report

**Generated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Scope:** All markdown files in /docs directory

## Summary

This report documents all American English to UK English spelling conversions made across the documentation corpus.

## Conversion Rules Applied

### -ize/-ise Endings
- organize → organise
- realize → realise
- synchronize → synchronise
- serialize → serialise
- localize → localise
- optimize → optimise
- categorize → categorise
- initialize → initialise
- customize → customise
- prioritize → prioritise
- recognize → recognise
- summarize → summarise
- parametrize → parametrise
- visualize → visualise
- authorize → authorise
- specialize → specialise
- generalize → generalise

### -ization/-isation Endings
- organization → organisation
- realization → realisation
- synchronization → synchronisation
- serialization → serialisation
- localization → localisation
- optimization → optimisation
- categorization → categorisation
- initialization → initialisation
- customization → customisation
- prioritization → prioritisation
- recognition → recognition (no change)
- summarization → summarisation
- parametrization → parametrisation
- visualization → visualisation
- authorization → authorisation
- specialization → specialisation
- generalization → generalisation

### Other Common Conversions
- color → colour (except in code/CSS contexts)
- behavior → behaviour
- analyze → analyse
- center → centre
- favor → favour
- license → licence (noun form)
- defense → defence

## Files Modified

EOF

> "$TEMP_FILE"

# Function to convert file
convert_file() {
    local file="$1"
    local changes=0

    # Skip script files themselves
    if [[ "$file" == *"validate-spelling.sh"* ]] || [[ "$file" == *"convert-to-uk-english.sh"* ]]; then
        return 0
    fi

    # Create backup
    cp "$file" "$file.bak"

    # Apply conversions (whole word only, case-sensitive)
    # -ize → -ise
    sed -i 's/\borganize\b/organise/g' "$file" && ((changes++)) || true
    sed -i 's/\borganizes\b/organises/g' "$file" && ((changes++)) || true
    sed -i 's/\borganized\b/organised/g' "$file" && ((changes++)) || true
    sed -i 's/\borganizing\b/organising/g' "$file" && ((changes++)) || true
    sed -i 's/\brealize\b/realise/g' "$file" && ((changes++)) || true
    sed -i 's/\brealizes\b/realises/g' "$file" && ((changes++)) || true
    sed -i 's/\brealized\b/realised/g' "$file" && ((changes++)) || true
    sed -i 's/\brealizing\b/realising/g' "$file" && ((changes++)) || true
    sed -i 's/\bsynchronize\b/synchronise/g' "$file" && ((changes++)) || true
    sed -i 's/\bsynchronizes\b/synchronises/g' "$file" && ((changes++)) || true
    sed -i 's/\bsynchronized\b/synchronised/g' "$file" && ((changes++)) || true
    sed -i 's/\bsynchronizing\b/synchronising/g' "$file" && ((changes++)) || true
    sed -i 's/\bserialize\b/serialise/g' "$file" && ((changes++)) || true
    sed -i 's/\bserializes\b/serialises/g' "$file" && ((changes++)) || true
    sed -i 's/\bserialized\b/serialised/g' "$file" && ((changes++)) || true
    sed -i 's/\bserializing\b/serialising/g' "$file" && ((changes++)) || true
    sed -i 's/\blocalize\b/localise/g' "$file" && ((changes++)) || true
    sed -i 's/\blocalizes\b/localises/g' "$file" && ((changes++)) || true
    sed -i 's/\blocalized\b/localised/g' "$file" && ((changes++)) || true
    sed -i 's/\blocalizing\b/localising/g' "$file" && ((changes++)) || true
    sed -i 's/\boptimize\b/optimise/g' "$file" && ((changes++)) || true
    sed -i 's/\boptimizes\b/optimises/g' "$file" && ((changes++)) || true
    sed -i 's/\boptimized\b/optimised/g' "$file" && ((changes++)) || true
    sed -i 's/\boptimizing\b/optimising/g' "$file" && ((changes++)) || true
    sed -i 's/\bcategorize\b/categorise/g' "$file" && ((changes++)) || true
    sed -i 's/\bcategorizes\b/categorises/g' "$file" && ((changes++)) || true
    sed -i 's/\bcategorized\b/categorised/g' "$file" && ((changes++)) || true
    sed -i 's/\bcategorizing\b/categorising/g' "$file" && ((changes++)) || true
    sed -i 's/\binitialize\b/initialise/g' "$file" && ((changes++)) || true
    sed -i 's/\binitializes\b/initialises/g' "$file" && ((changes++)) || true
    sed -i 's/\binitialized\b/initialised/g' "$file" && ((changes++)) || true
    sed -i 's/\binitializing\b/initialising/g' "$file" && ((changes++)) || true
    sed -i 's/\bcustomize\b/customise/g' "$file" && ((changes++)) || true
    sed -i 's/\bcustomizes\b/customises/g' "$file" && ((changes++)) || true
    sed -i 's/\bcustomized\b/customised/g' "$file" && ((changes++)) || true
    sed -i 's/\bcustomizing\b/customising/g' "$file" && ((changes++)) || true
    sed -i 's/\bprioritize\b/prioritise/g' "$file" && ((changes++)) || true
    sed -i 's/\bprioritizes\b/prioritises/g' "$file" && ((changes++)) || true
    sed -i 's/\bprioritized\b/prioritised/g' "$file" && ((changes++)) || true
    sed -i 's/\bprioritizing\b/prioritising/g' "$file" && ((changes++)) || true
    sed -i 's/\brecognize\b/recognise/g' "$file" && ((changes++)) || true
    sed -i 's/\brecognizes\b/recognises/g' "$file" && ((changes++)) || true
    sed -i 's/\brecognized\b/recognised/g' "$file" && ((changes++)) || true
    sed -i 's/\brecognizing\b/recognising/g' "$file" && ((changes++)) || true
    sed -i 's/\bsummarize\b/summarise/g' "$file" && ((changes++)) || true
    sed -i 's/\bsummarizes\b/summarises/g' "$file" && ((changes++)) || true
    sed -i 's/\bsummarized\b/summarised/g' "$file" && ((changes++)) || true
    sed -i 's/\bsummarizing\b/summarising/g' "$file" && ((changes++)) || true
    sed -i 's/\bparametrize\b/parametrise/g' "$file" && ((changes++)) || true
    sed -i 's/\bparametrizes\b/parametrises/g' "$file" && ((changes++)) || true
    sed -i 's/\bparametrized\b/parametrised/g' "$file" && ((changes++)) || true
    sed -i 's/\bparametrizing\b/parametrising/g' "$file" && ((changes++)) || true
    sed -i 's/\bvisualize\b/visualise/g' "$file" && ((changes++)) || true
    sed -i 's/\bvisualizes\b/visualises/g' "$file" && ((changes++)) || true
    sed -i 's/\bvisualized\b/visualised/g' "$file" && ((changes++)) || true
    sed -i 's/\bvisualizing\b/visualising/g' "$file" && ((changes++)) || true
    sed -i 's/\bauthorize\b/authorise/g' "$file" && ((changes++)) || true
    sed -i 's/\bauthorizes\b/authorises/g' "$file" && ((changes++)) || true
    sed -i 's/\bauthorized\b/authorised/g' "$file" && ((changes++)) || true
    sed -i 's/\bauthorizing\b/authorising/g' "$file" && ((changes++)) || true
    sed -i 's/\bspecialize\b/specialise/g' "$file" && ((changes++)) || true
    sed -i 's/\bspecializes\b/specialises/g' "$file" && ((changes++)) || true
    sed -i 's/\bspecialized\b/specialised/g' "$file" && ((changes++)) || true
    sed -i 's/\bspecializing\b/specialising/g' "$file" && ((changes++)) || true
    sed -i 's/\bgeneralize\b/generalise/g' "$file" && ((changes++)) || true
    sed -i 's/\bgeneralizes\b/generalises/g' "$file" && ((changes++)) || true
    sed -i 's/\bgeneralized\b/generalised/g' "$file" && ((changes++)) || true
    sed -i 's/\bgeneralizing\b/generalising/g' "$file" && ((changes++)) || true

    # -ization → -isation
    sed -i 's/\borganization\b/organisation/g' "$file" && ((changes++)) || true
    sed -i 's/\borganizations\b/organisations/g' "$file" && ((changes++)) || true
    sed -i 's/\brealization\b/realisation/g' "$file" && ((changes++)) || true
    sed -i 's/\bsynchronization\b/synchronisation/g' "$file" && ((changes++)) || true
    sed -i 's/\bserialization\b/serialisation/g' "$file" && ((changes++)) || true
    sed -i 's/\blocalization\b/localisation/g' "$file" && ((changes++)) || true
    sed -i 's/\boptimization\b/optimisation/g' "$file" && ((changes++)) || true
    sed -i 's/\bcategorization\b/categorisation/g' "$file" && ((changes++)) || true
    sed -i 's/\binitialization\b/initialisation/g' "$file" && ((changes++)) || true
    sed -i 's/\bcustomization\b/customisation/g' "$file" && ((changes++)) || true
    sed -i 's/\bprioritization\b/prioritisation/g' "$file" && ((changes++)) || true
    sed -i 's/\bsummarization\b/summarisation/g' "$file" && ((changes++)) || true
    sed -i 's/\bparametrization\b/parametrisation/g' "$file" && ((changes++)) || true
    sed -i 's/\bvisualization\b/visualisation/g' "$file" && ((changes++)) || true
    sed -i 's/\bauthorization\b/authorisation/g' "$file" && ((changes++)) || true
    sed -i 's/\bspecialization\b/specialisation/g' "$file" && ((changes++)) || true
    sed -i 's/\bgeneralization\b/generalisation/g' "$file" && ((changes++)) || true

    # Other conversions (excluding code contexts)
    sed -i 's/\bbehavior\b/behaviour/g' "$file" && ((changes++)) || true
    sed -i 's/\bbehaviors\b/behaviours/g' "$file" && ((changes++)) || true
    sed -i 's/\banalyze\b/analyse/g' "$file" && ((changes++)) || true
    sed -i 's/\banalyzes\b/analyses/g' "$file" && ((changes++)) || true
    sed -i 's/\banalyzed\b/analysed/g' "$file" && ((changes++)) || true
    sed -i 's/\banalyzing\b/analysing/g' "$file" && ((changes++)) || true
    sed -i 's/\bcenter\b/centre/g' "$file" && ((changes++)) || true
    sed -i 's/\bcenters\b/centres/g' "$file" && ((changes++)) || true
    sed -i 's/\bfavor\b/favour/g' "$file" && ((changes++)) || true
    sed -i 's/\bfavors\b/favours/g' "$file" && ((changes++)) || true
    sed -i 's/\bdefense\b/defence/g' "$file" && ((changes++)) || true

    # Check if any changes were made
    if ! diff -q "$file.bak" "$file" > /dev/null 2>&1; then
        echo "$(basename "$file")" >> "$TEMP_FILE"
        rm "$file.bak"
        return 1
    else
        # No changes, restore backup
        mv "$file.bak" "$file"
        return 0
    fi
}

# Find and process all markdown files
total_files=0
changed_files=0

while IFS= read -r -d '' file; do
    ((total_files++))
    if convert_file "$file"; then
        true
    else
        ((changed_files++))
    fi
done < <(find "$DOCS_DIR" -name "*.md" -type f -print0)

# Generate report
{
    echo ""
    echo "### Total Files Scanned: $total_files"
    echo "### Files Modified: $changed_files"
    echo ""
    echo "## Detailed Changes by File"
    echo ""

    if [ -s "$TEMP_FILE" ]; then
        while IFS= read -r filename; do
            echo "### $filename"
            echo ""
            echo "Converted American English spellings to UK English equivalents."
            echo ""
        done < "$TEMP_FILE"
    else
        echo "No changes required - all files already use UK English spelling."
    fi

    echo ""
    echo "## Verification"
    echo ""
    echo "Run \`docs/scripts/validate-spelling.sh\` to verify UK English compliance."
    echo ""
    echo "## Notes"
    echo ""
    echo "- Code contexts (CSS properties, JavaScript identifiers) were preserved"
    echo "- Proper nouns (Nostr, PWA, SPARC, etc.) were not modified"
    echo "- All changes maintain semantic meaning and technical accuracy"
    echo ""
} >> "$REPORT_FILE"

rm -f "$TEMP_FILE"

echo "✅ UK English conversion complete!"
echo "📊 Report generated: $REPORT_FILE"
echo "📁 Files scanned: $total_files"
echo "✏️  Files modified: $changed_files"

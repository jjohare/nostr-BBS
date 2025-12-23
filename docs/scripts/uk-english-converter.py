#!/usr/bin/env python3
"""
UK English Spelling Converter
Converts American English spellings to UK English across all markdown files.
"""

import re
import os
from pathlib import Path
from typing import Dict, List, Tuple

# Comprehensive spelling conversions (US -> UK)
CONVERSIONS = {
    # -ize to -ise
    r'\b(organ)ize\b': r'\1ise',
    r'\b(organ)izes\b': r'\1ises',
    r'\b(organ)ized\b': r'\1ised',
    r'\b(organ)izing\b': r'\1ising',
    r'\b(real)ize\b': r'\1ise',
    r'\b(real)izes\b': r'\1ises',
    r'\b(real)ized\b': r'\1ised',
    r'\b(real)izing\b': r'\1ising',
    r'\b(synchron)ize\b': r'\1ise',
    r'\b(synchron)izes\b': r'\1ises',
    r'\b(synchron)ized\b': r'\1ised',
    r'\b(synchron)izing\b': r'\1ising',
    r'\b(serial)ize\b': r'\1ise',
    r'\b(serial)izes\b': r'\1ises',
    r'\b(serial)ized\b': r'\1ised',
    r'\b(serial)izing\b': r'\1ising',
    r'\b(local)ize\b': r'\1ise',
    r'\b(local)izes\b': r'\1ises',
    r'\b(local)ized\b': r'\1ised',
    r'\b(local)izing\b': r'\1ising',
    r'\b(optim)ize\b': r'\1ise',
    r'\b(optim)izes\b': r'\1ises',
    r'\b(optim)ized\b': r'\1ised',
    r'\b(optim)izing\b': r'\1ising',
    r'\b(categor)ize\b': r'\1ise',
    r'\b(categor)izes\b': r'\1ises',
    r'\b(categor)ized\b': r'\1ised',
    r'\b(categor)izing\b': r'\1ising',
    r'\b(initial)ize\b': r'\1ise',
    r'\b(initial)izes\b': r'\1ises',
    r'\b(initial)ized\b': r'\1ised',
    r'\b(initial)izing\b': r'\1ising',
    r'\b(custom)ize\b': r'\1ise',
    r'\b(custom)izes\b': r'\1ises',
    r'\b(custom)ized\b': r'\1ised',
    r'\b(custom)izing\b': r'\1ising',
    r'\b(priorit)ize\b': r'\1ise',
    r'\b(priorit)izes\b': r'\1ises',
    r'\b(priorit)ized\b': r'\1ised',
    r'\b(priorit)izing\b': r'\1ising',
    r'\b(recogn)ize\b': r'\1ise',
    r'\b(recogn)izes\b': r'\1ises',
    r'\b(recogn)ized\b': r'\1ised',
    r'\b(recogn)izing\b': r'\1ising',
    r'\b(summar)ize\b': r'\1ise',
    r'\b(summar)izes\b': r'\1ises',
    r'\b(summar)ized\b': r'\1ised',
    r'\b(summar)izing\b': r'\1ising',
    r'\b(parametr)ize\b': r'\1ise',
    r'\b(parametr)izes\b': r'\1ises',
    r'\b(parametr)ized\b': r'\1ised',
    r'\b(parametr)izing\b': r'\1ising',
    r'\b(visual)ize\b': r'\1ise',
    r'\b(visual)izes\b': r'\1ises',
    r'\b(visual)ized\b': r'\1ised',
    r'\b(visual)izing\b': r'\1ising',
    r'\b(author)ize\b': r'\1ise',
    r'\b(author)izes\b': r'\1ises',
    r'\b(author)ized\b': r'\1ised',
    r'\b(author)izing\b': r'\1ising',
    r'\b(special)ize\b': r'\1ise',
    r'\b(special)izes\b': r'\1ises',
    r'\b(special)ized\b': r'\1ised',
    r'\b(special)izing\b': r'\1ising',
    r'\b(general)ize\b': r'\1ise',
    r'\b(general)izes\b': r'\1ises',
    r'\b(general)ized\b': r'\1ised',
    r'\b(general)izing\b': r'\1ising',

    # -ization to -isation
    r'\b(organ)ization\b': r'\1isation',
    r'\b(organ)izations\b': r'\1isations',
    r'\b(real)ization\b': r'\1isation',
    r'\b(synchron)ization\b': r'\1isation',
    r'\b(serial)ization\b': r'\1isation',
    r'\b(local)ization\b': r'\1isation',
    r'\b(optim)ization\b': r'\1isation',
    r'\b(categor)ization\b': r'\1isation',
    r'\b(initial)ization\b': r'\1isation',
    r'\b(custom)ization\b': r'\1isation',
    r'\b(priorit)ization\b': r'\1isation',
    r'\b(summar)ization\b': r'\1isation',
    r'\b(parametr)ization\b': r'\1isation',
    r'\b(visual)ization\b': r'\1isation',
    r'\b(author)ization\b': r'\1isation',
    r'\b(special)ization\b': r'\1isation',
    r'\b(general)ization\b': r'\1isation',

    # Other conversions
    r'\bbehavior\b': 'behaviour',
    r'\bbehaviors\b': 'behaviours',
    r'\banalyze\b': 'analyse',
    r'\banalyzes\b': 'analyses',
    r'\banalyzed\b': 'analysed',
    r'\banalyzing\b': 'analysing',
    r'\bcenter\b': 'centre',
    r'\bcenters\b': 'centres',
    r'\bfavor\b': 'favour',
    r'\bfavors\b': 'favours',
    r'\bdefense\b': 'defence',
}

# Patterns to exclude (code contexts, CSS, URLs, etc.)
EXCLUDE_PATTERNS = [
    r'```[\s\S]*?```',  # Code blocks
    r'`[^`]+`',  # Inline code
    r'color:',  # CSS properties
    r'backgroundColor',  # JavaScript/CSS properties
    r'textColor',  # JavaScript/CSS properties
    r'\.color\b',  # Property access
    r'fill:#[0-9a-fA-F]+,color:#',  # Mermaid diagrams
    r'https?://[^\s\)]+',  # URLs
]

def should_skip_line(line: str) -> bool:
    """Check if line should be skipped (code, CSS, etc.)"""
    for pattern in EXCLUDE_PATTERNS:
        if re.search(pattern, line):
            return True
    return False

def convert_file(file_path: Path) -> Tuple[int, List[str]]:
    """Convert a single file and return (changes_count, changes_list)"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    changes = []

    lines = content.split('\n')
    new_lines = []
    in_code_block = False

    for line in lines:
        # Track code blocks
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            new_lines.append(line)
            continue

        # Skip lines in code blocks or with excluded patterns
        if in_code_block or should_skip_line(line):
            new_lines.append(line)
            continue

        # Apply conversions
        new_line = line
        for us_pattern, uk_replacement in CONVERSIONS.items():
            old_line = new_line
            new_line = re.sub(us_pattern, uk_replacement, new_line)
            if old_line != new_line:
                # Record that a change was made
                changes.append(f"{us_pattern} → {uk_replacement}")

        new_lines.append(new_line)

    new_content = '\n'.join(new_lines)

    if new_content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return (len(set(changes)), list(set(changes)))

    return (0, [])

def main():
    docs_dir = Path('/home/devuser/workspace/nostr-BBS/docs')
    report_path = docs_dir / 'spelling-audit-report.md'

    # Find all markdown files
    md_files = list(docs_dir.rglob('*.md'))
    # Exclude the report itself and script files
    md_files = [f for f in md_files if f.name not in ['spelling-audit-report.md', 'validate-spelling.sh', 'convert-to-uk-english.sh', 'uk-english-converter.py']]

    total_files = len(md_files)
    modified_files = []
    all_changes = {}

    print(f"Scanning {total_files} markdown files...")

    for file_path in md_files:
        changes_count, changes_list = convert_file(file_path)
        if changes_count > 0:
            rel_path = file_path.relative_to(docs_dir)
            modified_files.append(str(rel_path))
            all_changes[str(rel_path)] = changes_list
            print(f"✓ {rel_path}: {changes_count} changes")

    # Generate report
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("# UK English Spelling Audit Report\n\n")
        f.write(f"**Generated:** {Path(__file__).stat().st_mtime}\n")
        f.write("**Scope:** All markdown files in /docs directory\n\n")

        f.write("## Summary\n\n")
        f.write(f"- **Total Files Scanned:** {total_files}\n")
        f.write(f"- **Files Modified:** {len(modified_files)}\n")
        f.write(f"- **Total Changes:** {sum(len(changes) for changes in all_changes.values())}\n\n")

        f.write("## Conversion Rules Applied\n\n")
        f.write("### -ize/-ise Endings\n")
        f.write("- organize → organise\n")
        f.write("- realize → realise\n")
        f.write("- synchronize → synchronise\n")
        f.write("- serialize → serialise\n")
        f.write("- localize → localise\n")
        f.write("- optimize → optimise\n")
        f.write("- categorize → categorise\n")
        f.write("- initialize → initialise\n")
        f.write("- customize → customise\n")
        f.write("- prioritize → prioritise\n")
        f.write("- recognize → recognise\n")
        f.write("- summarize → summarise\n")
        f.write("- parametrize → parametrise\n")
        f.write("- visualize → visualise\n")
        f.write("- authorize → authorise\n")
        f.write("- specialize → specialise\n")
        f.write("- generalize → generalise\n\n")

        f.write("### -ization/-isation Endings\n")
        f.write("- organization → organisation\n")
        f.write("- realization → realisation\n")
        f.write("- synchronization → synchronisation\n")
        f.write("- serialization → serialisation\n")
        f.write("- localization → localisation\n")
        f.write("- optimization → optimisation\n")
        f.write("- categorization → categorisation\n")
        f.write("- initialization → initialisation\n")
        f.write("- customization → customisation\n")
        f.write("- prioritization → prioritisation\n")
        f.write("- summarization → summarisation\n")
        f.write("- parametrization → parametrisation\n")
        f.write("- visualization → visualisation\n")
        f.write("- authorization → authorisation\n")
        f.write("- specialization → specialisation\n")
        f.write("- generalization → generalisation\n\n")

        f.write("### Other Conversions\n")
        f.write("- behavior → behaviour\n")
        f.write("- analyze → analyse\n")
        f.write("- center → centre\n")
        f.write("- favor → favour\n")
        f.write("- defense → defence\n\n")

        f.write("## Files Modified\n\n")
        if modified_files:
            for file_name in sorted(modified_files):
                f.write(f"### `{file_name}`\n\n")
                if file_name in all_changes:
                    f.write("Changes:\n")
                    for change in sorted(all_changes[file_name]):
                        f.write(f"- {change}\n")
                f.write("\n")
        else:
            f.write("No changes required - all files already use UK English spelling.\n\n")

        f.write("## Verification\n\n")
        f.write("Run `docs/scripts/validate-spelling.sh` to verify UK English compliance.\n\n")

        f.write("## Notes\n\n")
        f.write("- Code contexts (code blocks, inline code, CSS properties, JavaScript identifiers) were preserved\n")
        f.write("- Proper nouns (Nostr, PWA, SPARC, etc.) were not modified\n")
        f.write("- All changes maintain semantic meaning and technical accuracy\n")
        f.write("- Mermaid diagram syntax was preserved\n")
        f.write("- URLs and file paths were not modified\n")

    print(f"\n✅ Conversion complete!")
    print(f"📊 Files scanned: {total_files}")
    print(f"✏️  Files modified: {len(modified_files)}")
    print(f"📝 Report: {report_path}")

if __name__ == '__main__':
    main()

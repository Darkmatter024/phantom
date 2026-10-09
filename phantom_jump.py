#!/usr/bin/env python3
"""
phantom_jump.py — Surgical section extractor for PHANTOM (dct-ios.html)

Use this when working with Claude in a new chat. The PHANTOM file is too large
to upload to a fresh chat, so Claude needs you to paste specific sections.

USAGE
-----
  python3 phantom_jump.py SYMBOL [SYMBOL...]      # find function/var declarations
  python3 phantom_jump.py 17155-17175             # print exact line range
  python3 phantom_jump.py 17155                   # print 30 lines around line
  python3 phantom_jump.py "EDP_REVISION_APPLIED"  # search for string + show context
  python3 phantom_jump.py --list                  # list all top-level symbols
  python3 phantom_jump.py --list | grep variance  # filter the symbol list

Pipe to pbcopy on macOS to copy directly to clipboard:
  python3 phantom_jump.py _revGate_state | pbcopy

By default looks for dct-ios.html in the current directory.
Override with --file path/to/file.html

EXAMPLES
--------
  # Claude asks: "Paste _revGate_state and revGate_apply"
  python3 phantom_jump.py _revGate_state revGate_apply | pbcopy

  # Claude asks: "Show me lines 14997-15086"
  python3 phantom_jump.py 14997-15086 | pbcopy

  # You want to find where DRIFT_ACTIONS is used
  python3 phantom_jump.py "DRIFT_ACTIONS"

  # Show the whole symbol map
  python3 phantom_jump.py --list > phantom_map.txt
"""

import sys
import re
import os
import argparse

DEFAULT_FILE = "dct-ios.html"
DEFAULT_CONTEXT = 30
MAX_FUNC_LINES = 250  # safety cap on function body extraction


def find_file(path):
    """Find file in current directory or parent dirs."""
    candidates = [path, os.path.join("..", path), os.path.expanduser(f"~/{path}")]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
    return None


def load_lines(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read().split("\n")


def fmt_section(lines, start, end, label=None):
    """Format lines start..end (1-indexed, inclusive) with line numbers."""
    out = []
    width = len(str(end))
    if label:
        out.append(f"\n=== {label} (lines {start}-{end}) ===")
    for i in range(start - 1, min(end, len(lines))):
        n = i + 1
        out.append(f"{n:>{width}}  {lines[i]}")
    return "\n".join(out)


def find_symbol_decls(lines, symbol):
    """Find all lines that look like declarations of `symbol`.
    Matches: function NAME(, async function NAME(, var NAME =, const NAME =, let NAME ="""
    patterns = [
        rf"^\s*function\s+{re.escape(symbol)}\s*\(",
        rf"^\s*async\s+function\s+{re.escape(symbol)}\s*\(",
        rf"^\s*var\s+{re.escape(symbol)}\s*=",
        rf"^\s*const\s+{re.escape(symbol)}\s*=",
        rf"^\s*let\s+{re.escape(symbol)}\s*=",
    ]
    found = []
    for i, ln in enumerate(lines):
        for p in patterns:
            if re.match(p, ln):
                found.append(i + 1)
                break
    return found


def find_block_end(lines, start_line):
    """From start_line (1-indexed), find the line where the opening { is closed.
    Naive brace-counter; ignores string/regex contents. Good enough for this codebase.
    Returns 1-indexed line of close, or start_line + MAX_FUNC_LINES if not found."""
    depth = 0
    started = False
    cap = min(start_line - 1 + MAX_FUNC_LINES, len(lines))
    for i in range(start_line - 1, cap):
        for ch in lines[i]:
            if ch == "{":
                depth += 1
                started = True
            elif ch == "}":
                depth -= 1
                if started and depth == 0:
                    return i + 1
    return cap


def extract_symbol(lines, symbol):
    """Find a symbol's declaration and print its full body. If not found, fallback
    to substring search."""
    decls = find_symbol_decls(lines, symbol)
    if decls:
        for line_num in decls:
            end_line = find_block_end(lines, line_num)
            # Include 2 lines of comment context above
            start_line = max(1, line_num - 2)
            print(fmt_section(lines, start_line, end_line, label=symbol))
        return

    # Fallback — substring search (helps when symbol is partial or used as a string)
    hits = [i + 1 for i, ln in enumerate(lines) if symbol in ln]
    if not hits:
        print(f"\n=== {symbol} (NOT FOUND) ===")
        return
    print(f"\n=== {symbol} (no declaration; {len(hits)} substring match(es)) ===")
    for hit in hits[:10]:
        start = max(1, hit - 3)
        end = min(hit + 3, len(lines))
        print(f"\n--- substring at line {hit} ---")
        print(fmt_section(lines, start, end))
    if len(hits) > 10:
        print(f"\n[... {len(hits) - 10} more matches truncated, narrow your search]")


def extract_line(lines, line_num, context):
    """Print N lines centered on line_num."""
    half = context // 2
    start = max(1, line_num - half)
    end = min(line_num + half, len(lines))
    print(fmt_section(lines, start, end, label=f"around line {line_num}"))


def extract_range(lines, start, end):
    """Print exact line range."""
    if start < 1 or end > len(lines) or start > end:
        print(f"ERROR: invalid range {start}-{end} (file has {len(lines)} lines)", file=sys.stderr)
        return
    print(fmt_section(lines, start, end, label=f"lines {start}-{end}"))


def extract_string(lines, query):
    """Find substring matches and print 6 lines of context around each."""
    hits = [i + 1 for i, ln in enumerate(lines) if query in ln]
    if not hits:
        print(f"\n=== '{query}' (NO MATCHES) ===")
        return
    print(f"\n=== '{query}' ({len(hits)} match(es)) ===")
    for hit in hits[:15]:
        start = max(1, hit - 3)
        end = min(hit + 3, len(lines))
        print(f"\n--- match at line {hit} ---")
        print(fmt_section(lines, start, end))
    if len(hits) > 15:
        print(f"\n[... {len(hits) - 15} more matches truncated]")


def list_symbols(lines):
    """List all top-level function/var declarations with line numbers."""
    print("=== Top-level declarations in PHANTOM ===")
    print(f"    Line  [Kind ]  Name")
    print(f"    ----  -------  ----")
    pattern = re.compile(r"^\s*(?:(async)\s+)?(function|var|const|let)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)")
    count = 0
    for i, ln in enumerate(lines):
        m = pattern.match(ln)
        if m:
            kind = m.group(2)
            if m.group(1):
                kind = f"async {kind}"
            name = m.group(3)
            print(f"  {i+1:>6}  [{kind:>5}]  {name}")
            count += 1
    print(f"\n    {count} declarations total")


def main():
    parser = argparse.ArgumentParser(
        description="Surgical section extractor for PHANTOM (dct-ios.html). "
                    "Use to feed code regions to Claude without uploading the whole file.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="See docstring at top of script for usage examples.",
    )
    parser.add_argument("queries", nargs="*",
                        help="Symbol names, line numbers, ranges (N-M), or quoted strings")
    parser.add_argument("--file", default=DEFAULT_FILE,
                        help=f"File to search (default: {DEFAULT_FILE})")
    parser.add_argument("--lines", type=int, default=DEFAULT_CONTEXT,
                        help=f"Context lines around a single line query (default: {DEFAULT_CONTEXT})")
    parser.add_argument("--list", action="store_true",
                        help="List all top-level symbols with their line numbers")
    args = parser.parse_args()

    path = find_file(args.file)
    if not path:
        print(f"ERROR: File '{args.file}' not found in current dir or parents.", file=sys.stderr)
        print(f"       Run from your phantom repo directory, or use --file PATH.", file=sys.stderr)
        sys.exit(1)

    lines = load_lines(path)

    if args.list:
        list_symbols(lines)
        return

    if not args.queries:
        parser.print_help()
        sys.exit(1)

    for q in args.queries:
        if re.match(r"^\d+-\d+$", q):
            start, end = map(int, q.split("-"))
            extract_range(lines, start, end)
        elif re.match(r"^\d+$", q):
            extract_line(lines, int(q), args.lines)
        else:
            # Try as symbol first; falls back to substring inside extract_symbol
            extract_symbol(lines, q)


if __name__ == "__main__":
    main()

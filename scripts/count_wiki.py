# /// script
# requires-python = "==3.10.*"
# dependencies = ["kiwipiepy==0.23.2", "wikiextractor==3.0.6"]
# ///
"""Count dictionary nouns in Korean Wikipedia with Kiwi.

Input:  raw/kowiki-latest-pages-articles.xml.bz2, build/stdict-nouns.txt
Output: build/wiki-counts.tsv (`word\tcount`, count desc)
"""
import os
import subprocess
import sys
from collections import Counter
from pathlib import Path

from kiwipiepy import Kiwi

DUMP = Path("raw/kowiki-latest-pages-articles.xml.bz2")
NOUNS = Path("build/stdict-nouns.txt")
WIKI = Path("build/wiki")
OUT = Path("build/wiki-counts.tsv")


def extract():
    if WIKI.exists():
        return
    subprocess.run(
        [sys.executable, "-m", "wikiextractor.WikiExtractor", str(DUMP),
         "-o", str(WIKI), "-b", "50M", "--processes", str(os.cpu_count()), "-q"],
        check=True,
    )


def paragraphs():
    for path in sorted(WIKI.rglob("wiki_*")):
        with path.open(encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("<"):
                    yield line


def main():
    extract()
    nouns = set(NOUNS.read_text(encoding="utf-8").split())
    kiwi = Kiwi(num_workers=os.cpu_count())
    # Without this, Kiwi splits dictionary compounds and undercounts them.
    # Shorter words are left out: registering them turns particles and endings (에, 을, 대한) into nouns.
    for word in nouns:
        if len(word) >= 3:
            kiwi.add_user_word(word, "NNG")

    counts = Counter()
    skipped = 0
    for i, tokens in enumerate(kiwi.tokenize(paragraphs())):
        for token in tokens:
            try:
                if token.tag in ("NNG", "NNP") and token.form in nouns:
                    counts[token.form] += 1
            except UnicodeDecodeError:
                # Kiwi can split a surrogate pair inside odd text; skip that token.
                skipped += 1
        if i % 500_000 == 0:
            print(f"{i} paragraphs, {len(counts)} nouns, {skipped} skipped", file=sys.stderr, flush=True)

    OUT.write_text("".join(f"{w}\t{c}\n" for w, c in counts.most_common()), encoding="utf-8")


if __name__ == "__main__":
    main()

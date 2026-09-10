"""
Convert all PDF files in data/pdf_sources/ to PNG images (150 DPI).

Output layout:
    data/png_sources/<pdf_stem>/page_001.png
    data/png_sources/<pdf_stem>/page_002.png
    ...
"""

import sys
from pathlib import Path

import pymupdf

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = Path(__file__).resolve().parents[1]
PDF_DIR = BASE_DIR / "data" / "pdf_sources"
OUT_DIR = BASE_DIR / "data" / "png_sources"
DPI = 150


def convert_pdf(pdf_path: Path) -> list[Path]:
    dest = OUT_DIR / pdf_path.stem
    dest.mkdir(parents=True, exist_ok=True)

    written = []
    with pymupdf.open(pdf_path) as doc:
        for i, page in enumerate(doc, start=1):
            out_path = dest / f"page_{i:03d}.png"
            if out_path.exists():
                written.append(out_path)
                continue
            pix = page.get_pixmap(dpi=DPI)
            pix.save(out_path)
            written.append(out_path)
        print(f"[OK] {pdf_path.name}: {doc.page_count} pages -> {dest}")
    return written


def main() -> None:
    pdfs = sorted(PDF_DIR.glob("*.pdf"))
    if not pdfs:
        print(f"No PDF files found in {PDF_DIR}")
        sys.exit(1)

    total = 0
    for pdf in pdfs:
        total += len(convert_pdf(pdf))
    print(f"Done. {total} PNG images in {OUT_DIR}")


if __name__ == "__main__":
    main()

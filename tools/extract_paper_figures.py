"""Re-render the paper figures used on the page straight from the paper PDF.

Each figure is located by its caption ("Figure N:"): the crop is the union of the
drawings, images and figure text between the last body paragraph above it and the
caption, rendered at 360 dpi into static/images/paper/.

    uv run --with pymupdf python tools/extract_paper_figures.py path/to/paper.pdf

Run it again whenever the paper PDF changes (e.g. for the camera-ready version), then
check the output and update captions / numbers in index.html if they changed.
"""

import re
import sys
from pathlib import Path

import pymupdf

OUT = Path(__file__).resolve().parent.parent / "static" / "images" / "paper"

# output name -> (caption label, 1-based page, minimum x of the crop in PDF points)
FIGURES = {
    "fig1-terminal-bench": ("Figure 1", 1, 290),  # right-hand panel only
    "fig2-gaia": ("Figure 2", 4, 85),
    "fig4-claw-eval": ("Figure 4", 7, 85),
    "fig5-terminal-bench-runs": ("Figure 5", 8, 85),
    "fig10-rollouts": ("Figure 10", 22, 85),
    "fig11-library-reuse": ("Figure 11", 23, 85),
    "fig12-threshold-sweep": ("Figure 12", 24, 85),
}


def caption_rect(page, label):
    for block in page.get_text("blocks"):
        if re.match(r"^" + re.escape(label) + r":", block[4].strip()):
            return pymupdf.Rect(block[:4])
    raise ValueError(f"{label} not found on page {page.number + 1}")


def figure_rect(page, caption, xmin):
    blocks = page.get_text("dict")["blocks"]
    # Top limit: bottom of the last body-text paragraph (Times, ~10 pt) above the caption.
    top = 60.0
    for b in blocks:
        if b["type"] != 0:
            continue
        x0, _, x1, y1 = b["bbox"]
        if x1 < 100 or y1 > caption.y0 - 1:
            continue
        spans = [s for line in b["lines"] for s in line["spans"]]
        total = sum(len(s["text"]) for s in spans)
        body = sum(len(s["text"]) for s in spans if "NimbusRom" in s["font"] and s["size"] >= 9.5)
        if total > 40 and body / total > 0.85 and (x1 - x0) > 250:
            top = max(top, y1)

    def inside(r):
        return r.y0 >= top - 1 and r.y1 <= caption.y0 + 1 and r.x0 >= xmin

    rect = pymupdf.Rect()
    for d in page.get_drawings():
        if inside(d["rect"]) and d["rect"].width < 600:
            rect |= d["rect"]
    for info in page.get_image_info():
        r = pymupdf.Rect(info["bbox"])
        if inside(r):
            rect |= r
    for b in blocks:
        if b["type"] != 0:
            continue
        for line in b["lines"]:
            for s in line["spans"]:
                r = pymupdf.Rect(s["bbox"])
                is_line_number = s["text"].strip().isdigit() and r.x1 < 100
                if inside(r) and s["text"].strip() and not is_line_number:
                    rect |= r
    return pymupdf.Rect(rect.x0 - 4, rect.y0 - 4, rect.x1 + 4, rect.y1 + 4) & page.rect


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    doc = pymupdf.open(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (label, page_no, xmin) in FIGURES.items():
        page = doc[page_no - 1]
        rect = figure_rect(page, caption_rect(page, label), xmin)
        pix = page.get_pixmap(clip=rect, dpi=360, alpha=False)
        pix.save(OUT / f"{name}.png")
        print(f"{name:26s} {label:9s} page {page_no:>2}  {pix.width}x{pix.height}")


if __name__ == "__main__":
    main()

"""Source mode ingest (LLM-free): documents -> page-anchored chunks + a compact digest.

Every chunk's text is a verbatim substring of its page text, so any claim can be checked
against the page it cites. PDF: pdfplumber (MIT) then pypdf (BSD). DOCX: python-docx. MD/TXT.
"""
from __future__ import annotations

import re
from pathlib import Path

from .util import LoomError, info, write_json


def _pdf_pages(path: Path) -> list[str]:
    try:
        import pdfplumber  # type: ignore
        with pdfplumber.open(str(path)) as pdf:
            return [(p.extract_text() or "") for p in pdf.pages]
    except ImportError:
        pass
    try:
        from pypdf import PdfReader  # type: ignore
        return [(p.extract_text() or "") for p in PdfReader(str(path)).pages]
    except ImportError as e:
        raise LoomError("install pdfplumber or pypdf for PDF sources") from e


def _docx_pages(path: Path) -> list[str]:
    try:
        import docx  # type: ignore
    except ImportError as e:
        raise LoomError("install python-docx for .docx sources") from e
    d = docx.Document(str(path))
    text = "\n".join(p.text for p in d.paragraphs)
    return _paginate(text)


def _paginate(text: str, words_per_page: int = 450) -> list[str]:
    paras = [p for p in re.split(r"\n\s*\n", text) if p.strip()]
    pages, cur, n = [], [], 0
    for p in paras:
        w = len(p.split())
        if cur and n + w > words_per_page:
            pages.append("\n\n".join(cur)); cur, n = [], 0
        cur.append(p); n += w
    if cur:
        pages.append("\n\n".join(cur))
    return pages


def _clean(t: str) -> str:
    t = t.replace("ﬁ", "fi").replace("ﬂ", "fl")
    t = re.sub(r"(\w)-\n(\w)", r"\1\2", t)
    t = re.sub(r"[ \t]+", " ", t)
    return t.strip()


def ingest(project) -> dict:
    srcdir = project.path("sources")
    files = sorted(f for f in srcdir.iterdir() if f.is_file())
    if not files:
        raise LoomError("no source files in sources/")
    pages = []
    for f in files:
        ext = f.suffix.lower()
        raw = _pdf_pages(f) if ext == ".pdf" else _docx_pages(f) if ext == ".docx" else _paginate(f.read_text(encoding="utf-8", errors="replace"))
        for i, t in enumerate(raw, 1):
            pages.append({"doc": f.name, "page": i, "anchor": f"{f.stem}:p{i}", "text": _clean(t)})
    chunks, digest = [], [f"# Source digest ({len(files)} document(s), {len(pages)} pages)", ""]
    for pg in pages:
        paras = [p.strip() for p in re.split(r"\n{1,}", pg["text"]) if p.strip()]
        buf = ""
        for para in paras:
            if len((buf + " " + para).split()) > 110 and buf:
                chunks.append({"chunk_id": f"c{len(chunks) + 1}", "anchor": pg["anchor"], "text": buf.strip()}); buf = para
            else:
                buf = (buf + " " + para).strip() if buf else para
            if len(para.split()) <= 10 and para[:1].isupper() and not para.endswith("."):
                digest.append(f"- [{pg['anchor']}] {para}")
        if buf:
            chunks.append({"chunk_id": f"c{len(chunks) + 1}", "anchor": pg["anchor"], "text": buf.strip()})
    for c in chunks:  # grounding invariant: verbatim substring of its page (whitespace-normalised)
        page = next(p for p in pages if p["anchor"] == c["anchor"])
        if " ".join(c["text"].split()) not in " ".join(page["text"].split()):
            raise LoomError(f"ingest invariant broken for {c['chunk_id']}")
    write_json(project.path("source/dossier.json"), {"documents": [f.name for f in files], "pages": pages})
    write_json(project.path("source/chunks.json"), {"chunks": chunks})
    project.path("source/digest.md").write_text("\n".join(digest), encoding="utf-8")
    info(f"ingest: {len(files)} file(s), {len(pages)} pages, {len(chunks)} chunks")
    return {"pages": len(pages), "chunks": len(chunks)}

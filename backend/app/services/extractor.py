from __future__ import annotations

import io
import shutil
from pathlib import Path
from typing import Any

import pytesseract
import pymupdf as fitz
from pdf2image import convert_from_bytes
from PIL import Image, ImageOps

from app.config import get_settings


SUPPORTED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
}


def _configure_tesseract() -> None:
    configured_path = get_settings().TESSERACT_CMD
    executable = configured_path or shutil.which("tesseract")
    if executable:
        pytesseract.pytesseract.tesseract_cmd = executable


def _preprocess_and_ocr(image: Image.Image) -> str:
    grayscale = ImageOps.grayscale(image)
    enhanced = ImageOps.autocontrast(grayscale)
    return pytesseract.image_to_string(enhanced, config="--psm 6")


def extract_document(filename: str, content_type: str, content: bytes) -> dict[str, Any]:
    """Extract text from a supported PDF or image upload."""
    if content_type not in SUPPORTED_MIME_TYPES:
        raise ValueError(f"Unsupported file type: {content_type or 'unknown'}")
    if not content:
        raise ValueError("The uploaded file is empty.")

    _configure_tesseract()
    settings = get_settings()

    if content_type == "application/pdf":
        try:
            with fitz.open(stream=content, filetype="pdf") as document:
                page_count = len(document)
                embedded_text = "\n".join(page.get_text("text") for page in document).strip()
        except Exception as exc:
            raise ValueError("The uploaded PDF could not be opened.") from exc

        if len(embedded_text) >= 50:
            extracted_text = embedded_text
            method = "pymupdf"
        else:
            try:
                pages = convert_from_bytes(
                    content,
                    dpi=300,
                    poppler_path=settings.poppler_path or None,
                )
                extracted_text = "\n\n".join(_preprocess_and_ocr(page) for page in pages).strip()
            except Exception as exc:
                raise RuntimeError(
                    "PDF OCR failed. Check that Tesseract and Poppler are installed and configured."
                ) from exc
            method = "tesseract_ocr"
    else:
        try:
            with Image.open(io.BytesIO(content)) as source:
                image = source.copy()
        except Exception as exc:
            raise ValueError("The uploaded image could not be opened.") from exc
        extracted_text = _preprocess_and_ocr(image).strip()
        page_count = 1
        method = "tesseract_ocr"

    return {
        "filename": Path(filename).name,
        "method": method,
        "page_count": page_count,
        "char_count": len(extracted_text),
        "extracted_text": extracted_text,
    }


def extract_text(filename: str, content_type: str, content: bytes) -> dict[str, Any]:
    """Phase 2 pipeline name for the Phase 1 document extraction routine."""
    return extract_document(filename, content_type, content)

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import get_settings
from app.services.extractor import SUPPORTED_MIME_TYPES, extract_document


router = APIRouter()


@router.post("/extract")
async def extract(file: UploadFile = File(...)) -> dict:
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in SUPPORTED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Supported file types are PDF, PNG, JPEG, and WEBP.",
        )

    max_bytes = get_settings().max_upload_mb * 1024 * 1024
    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds the {get_settings().max_upload_mb} MB limit.")

    try:
        return extract_document(file.filename or "upload", content_type, content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

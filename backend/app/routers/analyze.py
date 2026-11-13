from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from app.config import get_settings
from app.schemas import ReportAnalysis
from app.services.explainer import explain_report
from app.services.extractor import SUPPORTED_MIME_TYPES, extract_text
from app.services.scrubber import scrub_pii


router = APIRouter()
SUPPORTED_LANGUAGES = {"en", "hi", "kn"}


@router.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    language: str = Form("en"),
) -> dict[str, object]:
    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=422, detail="language must be one of: en, hi, kn")

    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in SUPPORTED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Supported file types are PDF, PNG, JPEG, and WEBP.",
        )

    settings = get_settings()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds the {settings.max_upload_mb} MB limit.")

    try:
        extraction = await run_in_threadpool(
            extract_text,
            file.filename or "upload",
            content_type,
            content,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    scrubbed_text, redaction_count = scrub_pii(extraction["extracted_text"])
    extraction_meta = {key: value for key, value in extraction.items() if key != "extracted_text"}

    try:
        analysis = await run_in_threadpool(
            explain_report,
            scrubbed_text,
            language,
            extraction.get("ocr_confidence_note"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        if getattr(exc, "code", None) == 404:
            raise HTTPException(
                status_code=503,
                detail="The configured Gemini model is not available to this API key. Check model access or update GEMINI_MODEL.",
            ) from exc
        raise HTTPException(
            status_code=502,
            detail="Gemini analysis failed. Check GEMINI_API_KEY and provider availability, then retry.",
        ) from exc

    return {
        "extraction_meta": extraction_meta,
        "pii_redacted_count": redaction_count,
        "analysis": analysis,
    }

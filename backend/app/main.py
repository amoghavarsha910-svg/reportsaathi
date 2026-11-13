import shutil
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pytesseract

from app.config import get_settings
from app.routers.analyze import router as analyze_router
from app.routers.extract import router as extract_router
from app.routers.history import router as history_router


settings = get_settings()
if settings.TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
app = FastAPI(title="ReportSaathi API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _tesseract_ready() -> bool:
    configured = settings.TESSERACT_CMD
    executable = Path(configured) if configured else None
    if executable and executable.is_file():
        return True
    return bool(shutil.which(configured or "tesseract"))


def _poppler_ready() -> bool:
    configured = settings.poppler_path
    if configured:
        directory = Path(configured)
        return (directory / "pdftoppm.exe").is_file() or (directory / "pdftoppm").is_file()
    return bool(shutil.which("pdftoppm"))


@app.get("/api/health")
async def health() -> dict[str, bool | str]:
    return {
        "status": "ok",
        "tesseract_ready": _tesseract_ready(),
        "poppler_ready": _poppler_ready(),
    }


app.include_router(extract_router, prefix="/api")
app.include_router(analyze_router, prefix="/api")
app.include_router(history_router, prefix="/api")

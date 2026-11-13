from dataclasses import dataclass
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
import httpx
from pydantic import BaseModel, Field
from supabase import Client, create_client

from app.config import get_settings
from app.schemas import ReportAnalysis
from app.services.scrubber import scrub_pii


router = APIRouter()


class SavedReportInput(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    language: Literal["en", "hi", "kn"]
    summary: ReportAnalysis


@dataclass
class AuthenticatedSupabaseUser:
    user_id: str


def _create_supabase_client() -> Client:
    settings = get_settings()
    if not settings.SUPABASE_URL or not settings.SUPABASE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Saved report history is not configured; guest analysis is still available.")
    try:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Saved report history is currently unavailable.") from exc


async def require_supabase_user(authorization: str | None = Header(default=None)) -> AuthenticatedSupabaseUser:
    if not authorization:
        raise HTTPException(status_code=401, detail="Sign in to access saved reports.")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Use an Authorization: Bearer <token> header.")

    settings = get_settings()
    if not settings.SUPABASE_URL or not (settings.SUPABASE_PUBLISHABLE_KEY or settings.SUPABASE_SECRET_KEY):
        raise HTTPException(status_code=503, detail="Saved report history is not configured; guest analysis is still available.")
    try:
        transport = httpx.AsyncHTTPTransport(local_address="0.0.0.0")
        async with httpx.AsyncClient(transport=transport, timeout=10.0) as client:
            response = await client.get(
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": settings.SUPABASE_PUBLISHABLE_KEY or settings.SUPABASE_SECRET_KEY,
                    "Authorization": f"Bearer {token.strip()}",
                },
            )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Could not verify the access token with Supabase: {exc}",
        ) from exc

    if response.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail=f"Supabase token verification failed with HTTP {response.status_code}: {response.text}",
        )
    try:
        user_id = response.json()["id"]
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Supabase returned HTTP 200 but no valid user id: {exc}; response: {response.text}",
        ) from exc
    if not user_id:
        raise HTTPException(status_code=401, detail="Supabase user response did not include an id.")
    return AuthenticatedSupabaseUser(user_id=str(user_id))


def _scrub_json_strings(value):
    if isinstance(value, str):
        return scrub_pii(value)[0]
    if isinstance(value, list):
        return [_scrub_json_strings(item) for item in value]
    if isinstance(value, dict):
        return {key: _scrub_json_strings(item) for key, item in value.items()}
    return value


def _database_error() -> HTTPException:
    return HTTPException(status_code=503, detail="Saved report history is currently unavailable.")


@router.post("/reports")
def save_report(
    body: SavedReportInput,
    auth: AuthenticatedSupabaseUser = Depends(require_supabase_user),
    client: Client = Depends(_create_supabase_client),
) -> dict:
    cleaned_title, _ = scrub_pii(body.title.strip())
    if not cleaned_title.strip():
        raise HTTPException(status_code=422, detail="Report title must contain non-sensitive text.")

    summary_json = _scrub_json_strings(body.summary.model_dump(mode="json"))
    payload = {
        "user_id": auth.user_id,
        "title": cleaned_title.strip()[:160],
        "language": body.language,
        "summary": summary_json,
    }
    try:
        response = (
            client.table("saved_reports")
            .insert(payload)
            .select("id,title,language,summary,created_at")
            .single()
            .execute()
        )
        return response.data
    except Exception as exc:
        raise _database_error() from exc


@router.get("/reports")
def list_reports(
    auth: AuthenticatedSupabaseUser = Depends(require_supabase_user),
    client: Client = Depends(_create_supabase_client),
) -> list[dict]:
    try:
        response = (
            client.table("saved_reports")
            .select("id,title,language,summary,created_at")
            .eq("user_id", auth.user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []
    except Exception as exc:
        raise _database_error() from exc


@router.delete("/reports/{report_id}")
def delete_report(
    report_id: UUID,
    auth: AuthenticatedSupabaseUser = Depends(require_supabase_user),
    client: Client = Depends(_create_supabase_client),
) -> dict[str, bool]:
    try:
        response = (
            client.table("saved_reports")
            .delete()
            .eq("id", str(report_id))
            .eq("user_id", auth.user_id)
            .select("id")
            .execute()
        )
    except Exception as exc:
        raise _database_error() from exc
    if not response.data:
        raise HTTPException(status_code=404, detail="Saved report was not found.")
    return {"deleted": True}

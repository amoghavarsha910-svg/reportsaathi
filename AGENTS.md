# ReportSaathi Project Rules

- Project: ReportSaathi is an educational web app that explains medical laboratory reports in simple language.
- Stack: React + Vite + Tailwind CSS (`frontend/`, port 5173); Python + FastAPI (`backend/`, port 8000); PyMuPDF + Tesseract OCR (`pytesseract`, `pdf2image`); Gemini API (`google-genai` SDK using `gemini-3-flash-preview`); Supabase (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `VITE_SUPABASE_PUBLISHABLE_KEY`).
- Always keep guest mode 100% functional even when Supabase keys are empty.
- Never commit `.env`, `.venv`, or `node_modules`.
- Every explanation must remain strictly educational and non-diagnostic.

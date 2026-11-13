from typing import Literal

from pydantic import BaseModel, Field


class BiomarkerItem(BaseModel):
    test_name: str = Field(description="Recognizable laboratory test name, preserving the report's wording.")
    category: str = Field(description="Report section such as Complete Blood Count, Lipid Profile, or Liver Function.")
    observed_value: str = Field(description="Exact value printed in the report; do not normalize or infer it.")
    unit: str = Field(description="Exact unit printed in the report, or an empty string if none is shown.")
    reference_range: str = Field(description="Exact reference range printed in the report, or an empty string if none is shown.")
    status: Literal["normal", "borderline", "high", "low", "unclear"] = Field(
        description="Use unclear when the value, unit, range, or table alignment cannot be read confidently."
    )
    simple_explanation: str = Field(
        description="Two or three warm, plain-language educational sentences about what the marker measures and what this result means."
    )
    what_can_affect_it: list[str] = Field(
        description="Common, non-alarmist lifestyle or physiological factors that may affect this marker."
    )
    doctor_questions: list[str] = Field(
        description="One or two specific, neutral questions the reader can ask a physician."
    )


class ReportAnalysis(BaseModel):
    report_type: str
    overall_summary: str = Field(description="Calm, plain-language educational overview; never a diagnosis.")
    biomarkers: list[BiomarkerItem]
    general_next_steps: list[str]
    ocr_confidence_note: str | None = None

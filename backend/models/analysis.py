from pydantic import BaseModel, Field
from typing import List, Optional

class ExecutiveSummary(BaseModel):
    title: str = Field(..., description="Short descriptive title")
    participants: Optional[str] = Field(None, description="Participants involved")
    context: str = Field(..., description="Brief description of the purpose")
    summary: str = Field(..., description="3-sentence summary")

class KeyPoint(BaseModel):
    text: str = Field(..., description="The point itself")
    is_urgent: bool = Field(False, description="True if it has a deadline or marked as urgent")

class ActionItem(BaseModel):
    description: str
    owner: str = Field(..., description="Responsible person")
    due_date: Optional[str] = Field(None, description="Deadline if mentioned")

class Metadata(BaseModel):
    keywords: List[str]
    category: str = Field(..., description="Work, Personal, Legal, Ideas, etc.")
    sentiment: str = Field(..., description="Positive, Neutral, Tense, etc.")

class GravityAnalysisResult(BaseModel):
    executive_summary: ExecutiveSummary
    key_points: List[KeyPoint]
    mermaid_diagram: str = Field(..., description="Mermaid JS code")
    actions: List[ActionItem]
    metadata: Metadata

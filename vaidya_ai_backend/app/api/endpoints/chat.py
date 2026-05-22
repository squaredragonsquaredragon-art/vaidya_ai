import base64
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import ChatHistory, User
from app.services import llm_service
from app.api.endpoints.auth import get_current_user

router = APIRouter()


# --- Pydantic schemas ---

class SymptomRequest(BaseModel):
    text: str


class MedicineRequest(BaseModel):
    name: str


class DiseaseRequest(BaseModel):
    name: str


class AIResponse(BaseModel):
    data: dict
    source: str = "gpt-4o"


async def _log_chat(
    db: AsyncSession,
    user: Optional[User],
    endpoint: str,
    user_input: str,
    ai_response: dict,
):
    """Persist chat interaction to DB."""
    import json
    log = ChatHistory(
        user_id=user.id if user else None,
        endpoint=endpoint,
        user_input=user_input,
        ai_response=json.dumps(ai_response),
    )
    db.add(log)
    await db.commit()


# --- Endpoints ---

@router.post("/symptoms", response_model=AIResponse)
async def analyze_symptoms(
    request: SymptomRequest,
    accept_language: str = Header(default="en"),
    db: AsyncSession = Depends(get_db),
):
    """Analyze symptoms using GPT-4o and return structured medical guidance."""
    if not request.text or len(request.text.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please describe your symptoms in more detail.",
        )

    result = await llm_service.analyze_symptoms(request.text, accept_language)
    await _log_chat(db, None, "symptoms", request.text, result)
    return AIResponse(data=result)


@router.post("/medicine", response_model=AIResponse)
async def analyze_medicine(
    request: MedicineRequest,
    accept_language: str = Header(default="en"),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed drug information using GPT-4o."""
    if not request.name or len(request.name.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide a valid medicine name.",
        )

    result = await llm_service.analyze_medicine(request.name, accept_language)
    await _log_chat(db, None, "medicine", request.name, result)
    return AIResponse(data=result)


@router.post("/disease", response_model=AIResponse)
async def analyze_disease(
    request: DiseaseRequest,
    accept_language: str = Header(default="en"),
    db: AsyncSession = Depends(get_db),
):
    """Get disease encyclopedia entry using GPT-4o."""
    if not request.name or len(request.name.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide a valid disease name.",
        )

    result = await llm_service.analyze_disease(request.name, accept_language)
    await _log_chat(db, None, "disease", request.name, result)
    return AIResponse(data=result)


@router.post("/image-diagnosis", response_model=AIResponse)
async def image_diagnosis(
    file: UploadFile = File(...),
    accept_language: str = Header(default="en"),
    db: AsyncSession = Depends(get_db),
):
    """Analyze a skin/wound image using GPT-4o Vision."""
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG, WebP, and GIF images are supported.",
        )

    # Read and encode image
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB limit for Vision
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image must be smaller than 10MB.",
        )

    image_b64 = base64.b64encode(contents).decode("utf-8")
    result = await llm_service.analyze_skin_image(image_b64, file.content_type, accept_language)
    await _log_chat(db, None, "image-diagnosis", f"[image: {file.filename}]", result)
    return AIResponse(data=result)


@router.post("/tablet-scan", response_model=AIResponse)
async def tablet_scan(
    file: UploadFile = File(...),
    accept_language: str = Header(default="en"),
    db: AsyncSession = Depends(get_db),
):
    """Analyze a tablet packaging image using GPT-4o Vision."""
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG, WebP, and GIF images are supported.",
        )

    # Read and encode image
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB limit for Vision
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image must be smaller than 10MB.",
        )

    image_b64 = base64.b64encode(contents).decode("utf-8")
    result = await llm_service.analyze_tablet_image(image_b64, file.content_type, accept_language)
    await _log_chat(db, None, "tablet-scan", f"[image: {file.filename}]", result)
    return AIResponse(data=result)


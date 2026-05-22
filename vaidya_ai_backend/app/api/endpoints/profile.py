from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
import json

from app.db.database import get_db
from app.db.models import UserProfile, User, MedicalRecord
from app.api.endpoints.auth import get_current_user

router = APIRouter()

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    systolic: int
    diastolic: int
    sugar: int
    heart_rate: int
    height: float
    weight: float
    activity_level: str
    medications: str  # JSON String of list
    recent_activity: str  # JSON String of list
    report_count: int  # Dynamic metric

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    systolic: Optional[int] = None
    diastolic: Optional[int] = None
    sugar: Optional[int] = None
    heart_rate: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    activity_level: Optional[str] = None
    medications: Optional[str] = None  # JSON array as string
    recent_activity: Optional[str] = None  # JSON array as string

@router.get("/", response_model=ProfileResponse)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch profile or create default if not exists
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    # Fetch report count dynamically
    record_result = await db.execute(
        select(MedicalRecord).where(MedicalRecord.user_id == current_user.id)
    )
    records = record_result.scalars().all()
    report_count = len(records)

    # Add dynamic count to response
    response_data = ProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        systolic=profile.systolic,
        diastolic=profile.diastolic,
        sugar=profile.sugar,
        heart_rate=profile.heart_rate,
        height=profile.height,
        weight=profile.weight,
        activity_level=profile.activity_level,
        medications=profile.medications,
        recent_activity=profile.recent_activity,
        report_count=report_count
    )
    return response_data

@router.put("/", response_model=ProfileResponse)
async def update_profile(
    updates: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    # Apply updates
    if updates.systolic is not None:
        profile.systolic = updates.systolic
    if updates.diastolic is not None:
        profile.diastolic = updates.diastolic
    if updates.sugar is not None:
        profile.sugar = updates.sugar
    if updates.heart_rate is not None:
        profile.heart_rate = updates.heart_rate
    if updates.height is not None:
        profile.height = updates.height
    if updates.weight is not None:
        profile.weight = updates.weight
    if updates.activity_level is not None:
        profile.activity_level = updates.activity_level
    if updates.medications is not None:
        profile.medications = updates.medications
    if updates.recent_activity is not None:
        profile.recent_activity = updates.recent_activity

    await db.commit()
    await db.refresh(profile)

    # Fetch report count dynamically
    record_result = await db.execute(
        select(MedicalRecord).where(MedicalRecord.user_id == current_user.id)
    )
    records = record_result.scalars().all()
    report_count = len(records)

    return ProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        systolic=profile.systolic,
        diastolic=profile.diastolic,
        sugar=profile.sugar,
        heart_rate=profile.heart_rate,
        height=profile.height,
        weight=profile.weight,
        activity_level=profile.activity_level,
        medications=profile.medications,
        recent_activity=profile.recent_activity,
        report_count=report_count
    )

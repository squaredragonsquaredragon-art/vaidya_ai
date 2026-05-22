import os
import uuid
import mimetypes
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import aiofiles

from app.core.config import settings
from app.db.database import get_db
from app.db.models import MedicalRecord, User
from app.api.endpoints.auth import get_current_user

router = APIRouter()

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}


# --- Pydantic schemas ---

class RecordResponse(BaseModel):
    id: int
    original_filename: str
    file_type: str
    mime_type: str
    file_size: int
    created_at: str

    class Config:
        from_attributes = True


# --- Endpoints ---

@router.post("/upload", response_model=RecordResponse, status_code=status.HTTP_201_CREATED)
async def upload_record(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a medical file (PDF, image). Requires authentication."""
    # Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{file.content_type}' not allowed. Use PDF, JPG, PNG, or WebP.",
        )

    # Read file content
    contents = await file.read()
    file_size = len(contents)

    # Check size limit
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB.",
        )

    # Determine file type label
    ext = Path(file.filename or "file").suffix.lower()
    file_type = "Lab Report" if file.content_type == "application/pdf" else "Prescription"

    # Generate a unique stored filename (prevents directory traversal)
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    user_upload_dir = UPLOAD_DIR / str(current_user.id)
    user_upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = user_upload_dir / stored_filename

    # Write file to disk asynchronously
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(contents)

    # Persist record in DB
    record = MedicalRecord(
        user_id=current_user.id,
        original_filename=file.filename or stored_filename,
        stored_filename=stored_filename,
        file_path=str(file_path),
        file_type=file_type,
        mime_type=file.content_type,
        file_size=file_size,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return RecordResponse(
        id=record.id,
        original_filename=record.original_filename,
        file_type=record.file_type,
        mime_type=record.mime_type,
        file_size=record.file_size,
        created_at=record.created_at.isoformat(),
    )


@router.get("/", response_model=List[RecordResponse])
async def list_records(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all medical records for the authenticated user."""
    result = await db.execute(
        select(MedicalRecord)
        .where(MedicalRecord.user_id == current_user.id)
        .order_by(MedicalRecord.created_at.desc())
    )
    records = result.scalars().all()
    return [
        RecordResponse(
            id=r.id,
            original_filename=r.original_filename,
            file_type=r.file_type,
            mime_type=r.mime_type,
            file_size=r.file_size,
            created_at=r.created_at.isoformat(),
        )
        for r in records
    ]


@router.get("/{record_id}/download")
async def download_record(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download/view a specific medical record. Requires ownership."""
    result = await db.execute(
        select(MedicalRecord).where(
            MedicalRecord.id == record_id,
            MedicalRecord.user_id == current_user.id,
        )
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found.",
        )

    file_path = Path(record.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server.",
        )

    return FileResponse(
        path=str(file_path),
        media_type=record.mime_type,
        filename=record.original_filename,
    )


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a medical record (file + DB entry). Requires ownership."""
    result = await db.execute(
        select(MedicalRecord).where(
            MedicalRecord.id == record_id,
            MedicalRecord.user_id == current_user.id,
        )
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found.",
        )

    # Delete file from disk
    file_path = Path(record.file_path)
    if file_path.exists():
        file_path.unlink()

    await db.delete(record)
    await db.commit()

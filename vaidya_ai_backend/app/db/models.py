from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Text, ForeignKey, BigInteger, Float
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    records = relationship("MedicalRecord", back_populates="owner", cascade="all, delete-orphan")
    symptom_logs = relationship("SymptomLog", back_populates="owner", cascade="all, delete-orphan")
    profile = relationship("UserProfile", back_populates="owner", uselist=False, cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    systolic = Column(Integer, default=120)
    diastolic = Column(Integer, default=80)
    sugar = Column(Integer, default=95)
    heart_rate = Column(Integer, default=72)
    height = Column(Float, default=170.0)
    weight = Column(Float, default=70.0)
    activity_level = Column(String(100), default="moderate")  # "sedentary", "moderate", "active"
    medications = Column(Text, default="[]")  # JSON string of active medicines
    recent_activity = Column(Text, default="[]")  # JSON string of activity logs
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="profile")


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_filename = Column(String(500), nullable=False)
    stored_filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_type = Column(String(100), nullable=True)   # e.g. "Lab Report", "Prescription"
    mime_type = Column(String(100), nullable=True)
    file_size = Column(BigInteger, nullable=True)     # bytes
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="records")


class SymptomLog(Base):
    __tablename__ = "symptom_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    symptom_text = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="symptom_logs")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    endpoint = Column(String(100), nullable=True)    # e.g. "symptoms", "medicine", "disease"
    user_input = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


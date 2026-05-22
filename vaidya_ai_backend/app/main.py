import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import chat, auth, records, profile
from app.db.database import engine, Base
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup."""
    logger.info("🚀 Starting Vaidya AI backend...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables ready.")
    yield
    logger.info("👋 Shutting down Vaidya AI backend.")


app = FastAPI(
    title="Vaidya AI API",
    version="2.0.0",
    description="AI-powered medical assistant API — symptoms, medicines, diseases, image diagnosis.",
    lifespan=lifespan,
)

# CORS — allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/chat", tags=["AI Chat"])
app.include_router(records.router, prefix="/records", tags=["Medical Records"])
app.include_router(profile.router, prefix="/profile", tags=["Health Profile"])



@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "Vaidya AI API is running 🏥",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "vaidya-ai-backend"}

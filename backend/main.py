import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import init_db
from backend.domains.auth.router import router as auth_router
from backend.domains.spaces.router import router as spaces_router
from backend.domains.projects.router import router as projects_router
from backend.domains.materials.router import router as materials_router
from backend.domains.tutor.router import router as tutor_router
from backend.domains.quiz.router import router as quiz_router
from backend.domains.assessment.router import router as assessment_router
from backend.domains.mastery.router import router as mastery_router
from backend.domains.recommendations.router import router as recommendations_router
from backend.domains.differentiators.router import router as differentiators_router
from backend.domains.analytics.router import router as analytics_router
from backend.domains.admin.router import router as admin_router
from backend.seed import seed_demo_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    await init_db()
    # Seed default demo dataset if empty
    await seed_demo_data()
    logger.info("AI Study Companion API initialized and ready.")
    yield

app = FastAPI(
    title="AI Study Companion API",
    description="Grounded learning, adaptive quiz, concept mastery, and growth engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API router prefix
api_prefix = settings.API_V1_STR

app.include_router(auth_router, prefix=api_prefix)
app.include_router(spaces_router, prefix=api_prefix)
app.include_router(projects_router, prefix=api_prefix)
app.include_router(materials_router, prefix=api_prefix)
app.include_router(tutor_router, prefix=api_prefix)
app.include_router(quiz_router, prefix=api_prefix)
app.include_router(assessment_router, prefix=api_prefix)
app.include_router(mastery_router, prefix=api_prefix)
app.include_router(recommendations_router, prefix=api_prefix)
app.include_router(differentiators_router, prefix=api_prefix)
app.include_router(analytics_router, prefix=api_prefix)
app.include_router(admin_router, prefix=api_prefix)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI Study Companion API"}

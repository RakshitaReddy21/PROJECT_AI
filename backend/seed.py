import json
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from backend.database import AsyncSessionLocal
from backend.models.user import User
from backend.models.space import Space
from backend.models.project import Project
from backend.models.material import Material, DocumentChunk
from backend.models.concept import Concept
from backend.models.tutor import Conversation, Message
from backend.models.quiz import Quiz, QuizQuestion, QuizAttempt
from backend.models.assessment import Assessment, AssessmentSubmission
from backend.models.mastery import MasteryHistory
from backend.models.mistake import MistakeRecord
from backend.models.recommendation import Recommendation
from backend.models.learning_context import LearningContext
from backend.models.activity import ActivityEvent
from backend.models.ai_observability import AIRequest, EvaluationCase
from backend.domains.auth.security import get_password_hash
from backend.ai.providers import get_embedding_provider
from backend.ai.vector_store import vector_store

logger = logging.getLogger("backend.seed")

def days_ago(days: int, hours: int = 9) -> datetime:
    d = datetime.now(timezone.utc) - timedelta(days=days)
    return d.replace(hour=hours, minute=0, second=0, microsecond=0)

async def seed_demo_data():
    logger.info("Dynamic data mode active - static demo seeding bypassed.")
    return


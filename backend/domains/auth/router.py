import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database import get_db
from backend.models.user import User
from backend.schemas.auth import UserRegister, UserLogin, UserResponse, AuthResponse
from backend.domains.auth.security import get_password_hash, verify_password, create_access_token
from backend.domains.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

def format_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        createdAt=user.created_at.isoformat() if user.created_at else "",
    )

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(input_data: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == input_data.email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists",
        )
    
    role = "admin" if "admin" in input_data.email.lower() else "learner"
    new_user = User(
        id=f"u_{uuid.uuid4().hex[:12]}",
        name=input_data.name,
        email=input_data.email.lower(),
        password_hash=get_password_hash(input_data.password),
        role=role,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(subject=new_user.id, role=new_user.role)
    return AuthResponse(user=format_user_response(new_user), token=token)

@router.post("/login", response_model=AuthResponse)
async def login(input_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == input_data.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(input_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(subject=user.id, role=user.role)
    return AuthResponse(user=format_user_response(user), token=token)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return format_user_response(current_user)


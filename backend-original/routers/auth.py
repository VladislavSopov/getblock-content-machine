from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
import models, auth
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/auth", tags=["auth"], redirect_slashes=False)

class LoginSchema(BaseModel):
    email: str
    password: str

class RegisterSchema(BaseModel):
    email: str
    password: str
    role: Optional[str] = "viewer"

@router.post("/login")
async def login(data: LoginSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).where(models.User.email == data.email))
    user = result.scalars().first()
    if not user or not auth.verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth.create_access_token(data={"sub": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "role": user.role}
    }

@router.post("/register")
async def register(data: RegisterSchema, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Admin only to register users
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can register users")

    hashed_password = auth.get_password_hash(data.password)
    new_user = models.User(email=data.email, password_hash=hashed_password, role=data.role)
    db.add(new_user)
    try:
        await db.commit()
        return {"id": new_user.id, "email": new_user.email, "role": new_user.role}
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")

@router.get("/me")
async def me(current_user: models.User = Depends(auth.get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "role": current_user.role}

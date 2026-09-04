from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database import get_db
import models, auth
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/users", tags=["users"], redirect_slashes=False)

class CreateUser(BaseModel):
    email: str
    password: str
    role: Optional[str] = "viewer"

class UserUpdate(BaseModel):
    role: str

@router.get("", response_model=List[dict])
async def list_users(db: AsyncSession = Depends(get_db), admin: models.User = Depends(auth.require_admin)):
    result = await db.execute(select(models.User))
    users = result.scalars().all()
    return [{"id": u.id, "email": u.email, "role": u.role, "created_at": str(u.created_at)} for u in users]

@router.post("/")
async def create_user(data: CreateUser, db: AsyncSession = Depends(get_db), admin: models.User = Depends(auth.require_admin)):
    hashed_pw = auth.get_password_hash(data.password)
    user = models.User(email=data.email, password_hash=hashed_pw, role=data.role)
    db.add(user)
    try:
        await db.commit()
        return {"id": user.id, "email": user.email, "role": user.role}
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    return [{"id": u.id, "email": u.email, "role": u.role, "created_at": u.created_at} for u in users]

@router.delete("/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db), admin: models.User = Depends(auth.require_admin)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    await db.execute(delete(models.User).where(models.User.id == user_id))
    await db.commit()
    return {"status": "ok"}

@router.patch("/{user_id}")
async def update_user(user_id: str, data: UserUpdate, db: AsyncSession = Depends(get_db), admin: models.User = Depends(auth.require_admin)):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.role = data.role
    await db.commit()
    return {"id": user.id, "email": user.email, "role": user.role}

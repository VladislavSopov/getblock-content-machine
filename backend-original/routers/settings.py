from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
import models, auth
from typing import Dict

router = APIRouter(prefix="/api/settings", tags=["settings"], redirect_slashes=False)

@router.get("")
async def get_settings(db: AsyncSession = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    result = await db.execute(select(models.AppSettings))
    settings = result.scalars().all()
    return {s.key: s.value for s in settings}

@router.patch("")
async def update_settings(data: Dict[str, str], db: AsyncSession = Depends(get_db), admin: models.User = Depends(auth.require_admin)):
    for key, value in data.items():
        result = await db.execute(select(models.AppSettings).where(models.AppSettings.key == key))
        setting = result.scalars().first()
        if setting:
            setting.value = str(value)
        else:
            new_setting = models.AppSettings(key=key, value=str(value))
            db.add(new_setting)

    try:
        await db.commit()
        return {"status": "success"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

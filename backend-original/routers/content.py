import asyncio
import logging
logger = logging.getLogger(__name__)
_bg_tasks: set = set()
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from database import get_db, get_read_db, AsyncSessionLocal
import models, auth, ai_service
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/content", tags=["content"], redirect_slashes=False)

class BatchCreate(BaseModel):
    title: str
    source_text: str
    content_type: Optional[str] = "educational"
    tone: Optional[str] = "informative"
    audience: Optional[str] = "developers"
    keywords: Optional[str] = ""
    preferred_week: Optional[str] = ""
    channels: List[str]

class DraftUpdate(BaseModel):
    draft_text: Optional[str] = None
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    status: Optional[str] = None

@router.post("/batches")
async def create_batch(data: BatchCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_batch = models.ContentBatch(
        title=data.title,
        source_text=data.source_text,
        content_type=data.content_type,
        tone=data.tone,
        audience=data.audience,
        keywords=data.keywords,
        preferred_week=data.preferred_week,
        channels=data.channels,
        created_by=current_user.id
    )
    db.add(new_batch)
    await db.flush()
    result = await db.execute(select(models.AppSettings))
    settings = {s.key: s.value for s in result.scalars().all()}
    await db.commit()

    batch_id = new_batch.id
    batch_dict = data.dict()
    task = asyncio.create_task(_generate_drafts_bg(batch_id, batch_dict, settings))
    _bg_tasks.add(task)
    task.add_done_callback(_bg_tasks.discard)
    return {"id": new_batch.id, "title": new_batch.title}


async def _generate_drafts_bg(batch_id: str, batch_data: dict, settings: dict):
    async with AsyncSessionLocal() as db:
        try:
            logger.info(f"[BG] Starting draft generation for batch {batch_id}")
            drafts_data = await ai_service.generate_drafts(batch_data, settings)
            logger.info(f"[BG] AI returned {len(drafts_data)} drafts for batch {batch_id}")
            for d in drafts_data:
                db.add(models.ContentDraft(
                    batch_id=batch_id,
                    channel=d["channel"],
                    draft_text=d["draft_text"],
                    scheduled_date=d["scheduled_date"],
                    scheduled_time=d["scheduled_time"],
                    ai_reasoning=d["ai_reasoning"]
                ))
            result = await db.execute(select(models.ContentBatch).where(models.ContentBatch.id == batch_id))
            batch = result.scalars().first()
            if batch:
                batch.status = "done"
            await db.commit()
            logger.info(f"[BG] Committed {len(drafts_data)} drafts for batch {batch_id}")
        except Exception as e:
            await db.rollback()
            import traceback
            logger.error(f"[BG] Draft generation failed for batch {batch_id}: {e}\n{traceback.format_exc()}")
            async with AsyncSessionLocal() as db2:
                result = await db2.execute(select(models.ContentBatch).where(models.ContentBatch.id == batch_id))
                batch = result.scalars().first()
                if batch:
                    batch.status = "failed"
                    await db2.commit()

@router.get("/batches/{batch_id}/status")
async def get_batch_status(batch_id: str, db: AsyncSession = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    result = await db.execute(select(models.ContentBatch).where(models.ContentBatch.id == batch_id))
    batch = result.scalars().first()
    if not batch: raise HTTPException(status_code=404, detail="Batch not found")
    return {"id": batch.id, "status": batch.status}


@router.get("/batches")
async def list_batches(db: AsyncSession = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    result = await db.execute(select(models.ContentBatch).order_by(models.ContentBatch.created_at.desc()))
    return result.scalars().all()

@router.get("/batches/{batch_id}")
async def get_batch(batch_id: str, db: AsyncSession = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    result = await db.execute(select(models.ContentBatch).options(selectinload(models.ContentBatch.drafts)).where(models.ContentBatch.id == batch_id))
    batch = result.scalars().first()
    if not batch: raise HTTPException(status_code=404, detail="Batch not found")
    return batch

@router.get("/drafts")
async def list_drafts(channel: Optional[str] = None, status: Optional[str] = None, db: AsyncSession = Depends(get_read_db), user: models.User = Depends(auth.get_current_user)):
    query = select(models.ContentDraft).options(selectinload(models.ContentDraft.batch))
    if channel: query = query.where(models.ContentDraft.channel == channel)
    if status: query = query.where(models.ContentDraft.status == status)
    result = await db.execute(query.order_by(models.ContentDraft.created_at.desc()))
    drafts = result.scalars().all()
    return [
        {
            **{c.name: getattr(d, c.name) for c in d.__table__.columns},
            "batch_title": d.batch.title if d.batch else None,
        }
        for d in drafts
    ]

@router.patch("/drafts/{draft_id}")
async def update_draft(draft_id: str, data: DraftUpdate, db: AsyncSession = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    result = await db.execute(select(models.ContentDraft).where(models.ContentDraft.id == draft_id))
    draft = result.scalars().first()
    if not draft: raise HTTPException(status_code=404, detail="Draft not found")

    for k, v in data.dict(exclude_unset=True).items():
        setattr(draft, k, v)

    await db.commit()
    return draft

@router.post("/drafts/{draft_id}/regenerate")
async def regenerate_draft(draft_id: str, db: AsyncSession = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    result = await db.execute(select(models.ContentDraft).options(selectinload(models.ContentDraft.batch)).where(models.ContentDraft.id == draft_id))
    draft = result.scalars().first()
    if not draft: raise HTTPException(status_code=404, detail="Draft not found")

    settings_result = await db.execute(select(models.AppSettings))
    settings = {s.key: s.value for s in settings_result.scalars().all()}

    regen = await ai_service.regenerate_single_draft(draft.batch.title, draft.batch.source_text, draft.channel, draft.batch.tone, draft.batch.audience, draft.batch.keywords, settings)
    draft.draft_text = regen["draft_text"]
    draft.ai_reasoning = regen["ai_reasoning"]
    await db.commit()
    return draft

@router.delete("/drafts/{draft_id}")
async def delete_draft(draft_id: str, db: AsyncSession = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    await db.execute(delete(models.ContentDraft).where(models.ContentDraft.id == draft_id))
    await db.commit()
    return {"status": "ok"}

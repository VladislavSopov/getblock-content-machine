from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import database
import models
import auth
from routers import auth as auth_router, users, content, settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="GetBlock Content Machine API", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Create tables
    await database.create_all_tables()

    # Seed admin user
    async with database.AsyncSessionLocal() as db:
        result = await db.execute(select(models.User).where(models.User.email == "admin@getblock.io"))
        admin = result.scalars().first()
        if not admin:
            logger.info("Seeding admin user...")
            hashed_pw = auth.get_password_hash("admin123")
            new_admin = models.User(
                email="admin@getblock.io",
                password_hash=hashed_pw,
                role="admin"
            )
            db.add(new_admin)

            # Seed default settings
            default_settings = [
                models.AppSettings(key="OPENAI_API_KEY", value=""),
                models.AppSettings(key="ANTHROPIC_API_KEY", value=""),
                models.AppSettings(key="AI_MODEL", value="gpt-4-turbo"),
            ]
            db.add_all(default_settings)

            await db.commit()
            logger.info("Admin user seeded.")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "getblock-content-machine"}

# Include routers
app.include_router(auth_router.router)
app.include_router(users.router)
app.include_router(content.router)
app.include_router(settings.router)



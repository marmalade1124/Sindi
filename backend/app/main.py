from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import init_db
from app.worker import start_scheduler, stop_scheduler, scrape_job
from app.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Startup
    print("[Startup] Initializing database...")
    init_db()
    print("[Startup] Starting scheduler...")
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()


app = FastAPI(
    title="Sindí API",
    description="Power Outage Notification System backend API",
    lifespan=lifespan,
)

import os

# Configure CORS
allow_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


@app.get("/")
async def root():
    return {"message": "Welcome to the Sindí API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

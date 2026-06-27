import os

from contextlib import asynccontextmanager

from fastapi import (
    FastAPI,
    Depends,
    Request
)

from fastapi.middleware.cors import (
    CORSMiddleware
)

from fastapi.staticfiles import (
    StaticFiles
)

from app.database import (
    engine,
    Base
)



# =========================
# IMPORT MODELS
# =========================

from app.models.user_model import (
    User
)

from app.models.case_model import (
    Case
)

from app.models.timeline_model import (
    TimelineEvent
)

from app.models.hearing_model import (
    Hearing
)

from app.models.notification_model import (
    Notification
)

from app.models.document_model import (
    Document
)

from app.models.work_model import (
    Work
)



# =========================
# IMPORT ROUTERS
# =========================

from app.routes.auth_routes import (
    router as auth_router
)

from app.routes.case_routes import (
    router as case_router
)

from app.routes.timeline_routes import (
    router as timeline_router
)

from app.routes.hearing_routes import (
    router as hearing_router
)

from app.routes.notification_routes import (
    router as notification_router
)

from app.routes.document_routes import (
    router as document_router
)

from app.routes.dashboard_routes import (
    router as dashboard_router
)

from app.routes.work_routes import (
    router as work_router
)

# Websocket router removed as it is duplicated by notification_routes

from app.routes.page_routes import (
    router as page_router
)



from app.services.auth_service import (
    verify_token
)



# =========================
# BASE DIRECTORY
# =========================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)



# =========================
# STATIC DIRECTORIES
# =========================

STATIC_DIR = os.path.join(
    BASE_DIR,
    "static"
)

UPLOADS_DIR = os.path.join(
    BASE_DIR,
    "..",
    "uploads"
)

UPLOADS_DIR = os.path.abspath(UPLOADS_DIR)



# =========================
# CREATE DIRECTORIES
# =========================

os.makedirs(
    STATIC_DIR,
    exist_ok=True
)

os.makedirs(
    UPLOADS_DIR,
    exist_ok=True
)



# =========================
# APP LIFECYCLE
# =========================

@asynccontextmanager
async def lifespan(app: FastAPI):


    # CREATE DATABASE TABLES
    Base.metadata.create_all(
        bind=engine
    )

    print(
        "Database tables created successfully"
    )

    # RUN AUTO-MIGRATIONS (E.G. ENSURE COLUMN PAID_AMOUNT EXISTS)
    from app.database import SessionLocal
    from sqlalchemy import text
    db_migration = SessionLocal()
    try:
        db_migration.execute(text("SELECT paid_amount FROM clients LIMIT 1"))
    except Exception:
        print("[Migration] Column clients.paid_amount not found. Adding column...")
        try:
            db_migration.execute(text("ALTER TABLE clients ADD COLUMN paid_amount FLOAT DEFAULT 0.0"))
            db_migration.commit()
            print("[Migration] Column clients.paid_amount added successfully.")
        except Exception as alter_err:
            print(f"[Migration] Failed to add paid_amount column: {alter_err}")
    finally:
        db_migration.close()

    # AUTO-SEED ADMIN USER
    from app.database import SessionLocal
    from app.models.user_model import User
    from app.services.auth_service import hash_password

    db = SessionLocal()
    try:
        admin_email = "admin@example.com"
        admin_pass = "admin123"
        admin_exists = db.query(User).filter(User.role == "admin").first()
        if not admin_exists:
            email_exists = db.query(User).filter(User.email == admin_email).first()
            if not email_exists:
                admin_user = User(
                    full_name="Admin Lawyer",
                    email=admin_email,
                    password=hash_password(admin_pass),
                    role="admin",
                    phone_number="123-456-7890",
                )
                db.add(admin_user)
                db.commit()
                db.refresh(admin_user)
                print(f"[Lifespan Seed] Created default admin user: {admin_email}")
            else:
                email_exists.role = "admin"
                db.commit()
                print(f"[Lifespan Seed] Updated existing user {admin_email} to admin role")
        else:
            print(f"[Lifespan Seed] Admin user already exists: {admin_exists.email}")
    except Exception as e:
        print(f"[Lifespan Seed] Error auto-seeding admin: {e}")
    finally:
        db.close()

    yield

    print(
        "Application shutdown complete"
    )



# =========================
# CREATE FASTAPI APP
# =========================

app = FastAPI(

    title="Legal Case Management System",

    description="""
    Enterprise Legal Case Management SaaS
    Built using FastAPI + PostgreSQL
    """,

    version="1.0.0",

    lifespan=lifespan
)



# =========================
# CORS
# =========================

origins = [o.strip() for o in os.getenv("FRONTEND_URL", "http://localhost:5173").split(",") if o.strip()]
if "https://legalcase-eight.vercel.app" not in origins:
    origins.append("https://legalcase-eight.vercel.app")
if "https://frontend-legal-inky.vercel.app" not in origins:
    origins.append("https://frontend-legal-inky.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests_middleware(request: Request, call_next):
    client_host = request.client.host if request.client else "unknown"
    print(f"[API Request] {request.method} -> {request.url.path} (Client: {client_host})")
    response = await call_next(request)
    print(f"[API Response] {request.method} -> {request.url.path} | Status: {response.status_code}")
    return response




# =========================
# STATIC FILES
# =========================

app.mount(

    "/static",

    StaticFiles(directory=STATIC_DIR),

    name="static"
)



# =========================
# UPLOAD FILES
# =========================

app.mount(

    "/uploads",

    StaticFiles(directory=UPLOADS_DIR),

    name="uploads"
)



# =========================
# INCLUDE ROUTERS
# =========================

app.include_router(auth_router)

app.include_router(case_router)

app.include_router(timeline_router)

app.include_router(hearing_router)

app.include_router(notification_router)

app.include_router(document_router)

app.include_router(dashboard_router)

app.include_router(work_router)

# app.include_router(websocket_router)

app.include_router(page_router)



# =========================
# PROTECTED TEST ROUTE
# =========================

@app.get("/protected")
def protected_route(

    user_data: dict = Depends(
        verify_token
    )
):

    return {

        "message":
        "Protected route accessed",

        "user":
        user_data
    }



# =========================
# API HOME
# =========================

@app.get("/api")
def api_home():

    return {

        "status":
        "success",

        "message":
        "Legal Case Management API Running Successfully"
    }



# =========================
# HEALTH CHECK
# =========================

@app.get("/health")
def health_check():

    return {

        "status":
        "healthy",

        "service":
        "legal-case-management",

        "database":
        "connected"
    }



# =========================
# VERSION
# =========================

@app.get("/version")
def version():

    return {

        "version":
        "1.0.0"
    }
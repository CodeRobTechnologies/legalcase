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
        db_migration.rollback()
        print("[Migration] Column clients.paid_amount not found. Adding column...")
        try:
            db_migration.execute(text("ALTER TABLE clients ADD COLUMN paid_amount FLOAT DEFAULT 0.0"))
            db_migration.commit()
            print("[Migration] Column clients.paid_amount added successfully.")
        except Exception as alter_err:
            db_migration.rollback()
            print(f"[Migration] Failed to add paid_amount column: {alter_err}")
    finally:
        db_migration.close()

    db_migration = SessionLocal()
    try:
        db_migration.execute(text("SELECT case_date FROM cases LIMIT 1"))
    except Exception:
        db_migration.rollback()
        print("[Migration] Column cases.case_date not found. Adding column...")
        try:
            db_migration.execute(text("ALTER TABLE cases ADD COLUMN case_date TIMESTAMP"))
            db_migration.commit()
            print("[Migration] Column cases.case_date added successfully.")
        except Exception as alter_err:
            db_migration.rollback()
            print(f"[Migration] Failed to add case_date column: {alter_err}")
    finally:
        db_migration.close()

    db_migration = SessionLocal()
    try:
        db_migration.execute(text("SELECT admin_id FROM users LIMIT 1"))
    except Exception:
        db_migration.rollback()
        print("[Migration] Column users.admin_id not found. Adding column...")
        try:
            db_migration.execute(text("ALTER TABLE users ADD COLUMN admin_id INTEGER"))
            db_migration.commit()
            print("[Migration] Column users.admin_id added successfully.")
        except Exception as alter_err:
            db_migration.rollback()
            print(f"[Migration] Failed to add admin_id column: {alter_err}")
    finally:
        db_migration.close()

    # AUTO-SEED ADMIN USERS & ASSISTANTS
    from app.database import SessionLocal
    from app.models.user_model import User
    from app.services.auth_service import hash_password

    db = SessionLocal()
    try:
        # 1. First Admin
        admin1_email = "admin@example.com"
        admin1_pass = "admin123"
        admin1 = db.query(User).filter(User.email == admin1_email).first()
        if not admin1:
            admin1 = User(
                full_name="Admin Lawyer",
                email=admin1_email,
                password=hash_password(admin1_pass),
                role="admin",
                phone_number="123-456-7890",
            )
            db.add(admin1)
            db.commit()
            db.refresh(admin1)
            print(f"[Lifespan Seed] Created first admin: {admin1_email}")
        else:
            if admin1.role != "admin":
                admin1.role = "admin"
                db.commit()
                print(f"[Lifespan Seed] Updated {admin1_email} to admin role")

        # 2. Second Admin
        admin2_email = "admin2@example.com"
        admin2_pass = "admin123"
        admin2 = db.query(User).filter(User.email == admin2_email).first()
        if not admin2:
            admin2 = User(
                full_name="Second Admin Lawyer",
                email=admin2_email,
                password=hash_password(admin2_pass),
                role="admin",
                phone_number="123-456-7890",
            )
            db.add(admin2)
            db.commit()
            db.refresh(admin2)
            print(f"[Lifespan Seed] Created second admin: {admin2_email}")
        else:
            if admin2.role != "admin":
                admin2.role = "admin"
                db.commit()
                print(f"[Lifespan Seed] Updated {admin2_email} to admin role")

        # 3. Assistants for Second Admin
        for i in range(1, 4):
            asst_email = f"assistant{i}_admin2@example.com"
            asst_pass = "assistant123"
            asst = db.query(User).filter(User.email == asst_email).first()
            if not asst:
                asst = User(
                    full_name=f"Admin 2 Assistant {i}",
                    email=asst_email,
                    password=hash_password(asst_pass),
                    role="lawyer",
                    phone_number=f"123-456-789{i}",
                    admin_id=admin2.id
                )
                db.add(asst)
                db.commit()
                print(f"[Lifespan Seed] Created assistant {i} for second admin: {asst_email}")
    except Exception as e:
        print(f"[Lifespan Seed] Error auto-seeding admins and assistants: {e}")
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
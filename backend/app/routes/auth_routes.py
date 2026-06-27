from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Body, Response,
    Request,
    Header
)

from fastapi.security import (
    OAuth2PasswordRequestForm
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.user_model import (
    User
)

from typing import List, Optional
from app.schemas.user_schema import (
    UserCreate,
    UserLogin,
    UserResponse
)

from app.services.auth_service import (

    hash_password,

    verify_password,

    create_access_token,

    verify_token
)

from pydantic import BaseModel


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)



# =========================
# REGISTER USER
# =========================

@router.post("/register")
def register_user(

    user: UserCreate,

    db: Session = Depends(get_db),

    authorization: Optional[str] = Header(None)
):

    existing_user = db.query(User).filter(

        User.email == user.email

    ).first()



    if existing_user:

        raise HTTPException(

            status_code=400,

            detail="Email already registered"
        )



    # HASH PASSWORD
    hashed_password = hash_password(
        user.password
    )



    # Determine admin_id and role
    admin_id = user.admin_id
    role = user.role or "lawyer"

    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            user_data = verify_token(token)
            if user_data and user_data.get("role") == "admin":
                admin_id = user_data.get("user_id")
                role = "lawyer"
        except Exception:
            pass

    # CREATE USER
    new_user = User(

        full_name=user.full_name,

        email=user.email,

        password=hashed_password,

        role=role,

        phone_number=user.phone_number,

        admin_id=admin_id
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)



    return {

        "message":
        "User registered successfully",

        "user": {

            "id":
            new_user.id,

            "full_name":
            new_user.full_name,

            "email":
            new_user.email,

            "role":
            new_user.role
        }
    }



# =========================
# LOGIN SCHEMA AND ROUTE
# =========================

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
async def login(
    request: Request,
    db: Session = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    username = None
    password = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            username = body.get("username") or body.get("email")
            password = body.get("password")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
    else:
        try:
            form_data = await request.form()
            username = form_data.get("username")
            password = form_data.get("password")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid form data")

    if not username or not password:
        raise HTTPException(
            status_code=422,
            detail=[{"loc": ["body"], "msg": "Username and password are required", "type": "value_error"}]
        )

    db_user = db.query(User).filter(
        User.email == username
    ).first()

    # USER NOT FOUND
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # INVALID PASSWORD
    if not verify_password(
        password,
        db_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )

    # CREATE JWT TOKEN
    access_token = create_access_token(
        data={
            "user_id": db_user.id,
            "email": db_user.email,
            "role": db_user.role
        }
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "full_name": db_user.full_name,
            "email": db_user.email,
            "role": db_user.role
        }
    }
# =========================
# GET CURRENT USER
# =========================

@router.get("/me")
def get_current_user(

    user_data: dict = Depends(
        verify_token
    ),

    db: Session = Depends(get_db)
):

    user = db.query(User).filter(

        User.id == user_data["user_id"]

    ).first()



    if not user:

        raise HTTPException(

            status_code=404,

            detail="User not found"
        )



    return {

        "id":
        user.id,

        "full_name":
        user.full_name,

        "email":
        user.email,

        "role":
        user.role,

        "phone_number":
        user.phone_number
    }



# =========================
# VERIFY TOKEN
# =========================

@router.get("/verify")
def verify_user_token(

    user_data: dict = Depends(
        verify_token
    )
):

    return {

        "valid":
        True,

        "user":
        user_data
    }



# =========================
# ADMIN CHECK
# =========================

@router.get("/admin-check")
def admin_check(

    user_data: dict = Depends(
        verify_token
    )
):

    if user_data["role"] != "admin":

        raise HTTPException(

            status_code=status.HTTP_403_FORBIDDEN,

            detail="Admin access required"
        )



    return {

        "message":
        "Admin access granted"
    }

# =========================
# DEV ONLY: QUICK SEED LOGIN
# =========================
@router.post("/login-seed", include_in_schema=False)
def login_seed(db: Session = Depends(get_db)):
    """Return JWT for the first seeded user (development only)."""
    import os
    if os.getenv("ENV") != "dev":
        raise HTTPException(status_code=403, detail="Not allowed in this environment")
    seed_user = db.query(User).first()
    if not seed_user:
        raise HTTPException(status_code=404, detail="No seeded user found")
    access_token = create_access_token(data={"user_id": seed_user.id, "email": seed_user.email, "role": seed_user.role})
    return {
        "message": "Login successful (seed user)",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": seed_user.id,
            "full_name": seed_user.full_name,
            "email": seed_user.email,
            "role": seed_user.role,
        },
    }

# =========================
# ADMIN ONLY: UPDATE USER ROLE
# =========================
@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_token)
):
    admin_db_user = db.query(User).filter(User.id == admin_user["user_id"]).first()
    if not admin_db_user or admin_db_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    target_user.role = role
    db.commit()
    db.refresh(target_user)
    
    return {"message": "User role updated successfully", "user_id": target_user.id, "new_role": target_user.role}

# =========================
# GET ALL ASSISTANTS (LAWYERS)
# =========================
@router.get("/assistants", response_model=List[UserResponse])
def get_assistants(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_token)
):
    admin_db_user = db.query(User).filter(User.id == admin_user["user_id"]).first()
    if not admin_db_user or admin_db_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    # Assistants are all users with role "lawyer" managed by this admin
    assistants = db.query(User).filter(
        User.role == "lawyer",
        User.admin_id == admin_db_user.id
    ).all()
    return assistants
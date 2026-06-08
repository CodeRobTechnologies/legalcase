import os

from datetime import (
    datetime,
    timedelta,
    timezone
)

from jose import (
    jwt,
    JWTError,
    ExpiredSignatureError
)

from passlib.context import (
    CryptContext
)

from fastapi import (
    Depends,
    HTTPException,
    status
)

from fastapi.security import (
    OAuth2PasswordBearer
)

from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user_model import User



# =========================
# LOAD ENVIRONMENT
# =========================

load_dotenv()



# =========================
# SECURITY CONFIG
# =========================

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is missing!")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))



# =========================
# PASSWORD HASHING
# =========================

pwd_context = CryptContext(

    schemes=["bcrypt"],

    deprecated="auto"
)



# =========================
# OAUTH2
# =========================

oauth2_scheme = OAuth2PasswordBearer(

    tokenUrl="/auth/login"
)



# =========================
# HASH PASSWORD
# =========================

def hash_password(
    password: str
):

    return pwd_context.hash(
        password
    )



# =========================
# VERIFY PASSWORD
# =========================

def verify_password(

    plain_password: str,

    hashed_password: str
):

    return pwd_context.verify(

        plain_password,

        hashed_password
    )



# =========================
# CREATE JWT TOKEN
# =========================

def create_access_token(
    data: dict
):

    to_encode = data.copy()



    expire = (

        datetime.now(
            timezone.utc
        ) +

        timedelta(
            minutes=
            ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )



    to_encode.update({

        "exp":
        expire,

        "iss":
        "legalcase-auth",

        "aud":
        "legalcase-api"
    })



    encoded_jwt = jwt.encode(

        to_encode,

        SECRET_KEY,

        algorithm=ALGORITHM
    )



    return encoded_jwt



# =========================
# VERIFY JWT TOKEN
# =========================

def verify_token(

    token: str = Depends(
        oauth2_scheme
    )
):

    try:


        payload = jwt.decode(

            token,

            SECRET_KEY,

            algorithms=[ALGORITHM],

            audience="legalcase-api",

            issuer="legalcase-auth"
        )

        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
            payload["role"] = user.role
        finally:
            db.close()

        return payload



    except ExpiredSignatureError:


        raise HTTPException(

            status_code=
            status.HTTP_401_UNAUTHORIZED,

            detail=
            "Token expired"
        )



    except JWTError:


        raise HTTPException(

            status_code=
            status.HTTP_401_UNAUTHORIZED,

            detail=
            "Invalid token"
        )




# =========================
# CURRENT USER
# =========================

def get_current_user(

    user_data: dict = Depends(
        verify_token
    )
):

    return user_data



# =========================
# ADMIN ROLE
# =========================

def verify_admin(

    user_data: dict = Depends(
        verify_token
    )
):

    if user_data.get(
        "role"
    ) != "admin":


        raise HTTPException(

            status_code=
            status.HTTP_403_FORBIDDEN,

            detail=
            "Admin access required"
        )



    return user_data



# =========================
# LAWYER ROLE
# =========================

def verify_lawyer(

    user_data: dict = Depends(
        verify_token
    )
):

    if user_data.get(
        "role"
    ) != "lawyer":


        raise HTTPException(

            status_code=
            status.HTTP_403_FORBIDDEN,

            detail=
            "Lawyer access required"
        )



    return user_data



# =========================
# CLIENT ROLE
# =========================

def verify_client(

    user_data: dict = Depends(
        verify_token
    )
):

    if user_data.get(
        "role"
    ) != "client":


        raise HTTPException(

            status_code=
            status.HTTP_403_FORBIDDEN,

            detail=
            "Client access required"
        )



    return user_data



# =========================
# OPTIONAL ROLE CHECK
# =========================

def verify_roles(

    allowed_roles: list
):

    def role_checker(

        user_data: dict = Depends(
            verify_token
        )
    ):

        if user_data.get(
            "role"
        ) not in allowed_roles:


            raise HTTPException(

                status_code=
                status.HTTP_403_FORBIDDEN,

                detail=
                "Permission denied"
            )



        return user_data

    return role_checker
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)
from sqlalchemy.exc import IntegrityError

from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import Optional
from pydantic import BaseModel

from datetime import datetime

from app.database import SessionLocal

from app.models.hearing_model import Hearing
from app.models.case_model import Case
from app.models.user_model import User

class HearingCreate(BaseModel):
    case_id: int
    hearing_date: datetime
    location: str
    status: Optional[str] = "Scheduled"

from app.services.auth_service import (
    verify_token
)

from app.services.whatsapp_service import (
    send_whatsapp_message
)

from app.services.notification_service import (
    create_system_notification
)

from app.services.timeline_service import (
    create_timeline_event
)


router = APIRouter(
    prefix="/hearings",
    tags=["Hearings"]
)



# =========================
# DATABASE CONNECTION
# =========================

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()



# =========================
# CREATE HEARING
# =========================

@router.post("/")
async def create_hearing(

    hearing: HearingCreate,

    db: Session = Depends(get_db),

    user_data: dict = Depends(verify_token)

):

    # Validate required fields
    if not hearing.case_id:
        raise HTTPException(status_code=400, detail="case_id is required")
    if not hearing.hearing_date:
        raise HTTPException(status_code=400, detail="hearing_date is required")
    if not hearing.location:
        raise HTTPException(status_code=400, detail="location is required")

    existing_case = db.query(Case).filter(
        Case.id == hearing.case_id
    ).first()


    if not existing_case:

        raise HTTPException(

            status_code=404,

            detail="Case not found"
        )

    role = user_data.get("role")
    user_id = user_data.get("user_id")
    if role != "admin" and existing_case.lawyer_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )


    new_hearing = Hearing(
        case_id=hearing.case_id,
        hearing_date=hearing.hearing_date,
        location=hearing.location,
        status=hearing.status or "Scheduled",
    )

    # Save the new hearing
    db.add(new_hearing)
    db.commit()
    db.refresh(new_hearing)



    # =========================
    # TIMELINE EVENT
    # =========================

    create_timeline_event(

        db=db,

        case_id=existing_case.id,

        title="Hearing Scheduled",

        description=f"""

Date:
{new_hearing.hearing_date}

Location:
{new_hearing.location}

Status:
{new_hearing.status}

        """
    )



    # =========================
    # CREATE NOTIFICATION
    # =========================

    # =========================
    # CREATE NOTIFICATION
    # =========================
    try:
        # Determine notification details based on status
        if new_hearing.status == "Cancelled":
            n_title = "Hearing Cancelled"
            n_type = "Cancellation"
        elif new_hearing.status == "Completed":
            n_title = "Hearing Completed"
            n_type = "Completion"
        else:
            n_title = "Hearing Scheduled"
            n_type = "Hearing"
        await create_system_notification(
            db=db,
            user_id=user_data["user_id"],
            title=n_title,
            message=f"""
Case:
{existing_case.case_title}

Date:
{new_hearing.hearing_date}

Location:
{new_hearing.location}

Status:
{new_hearing.status}
""",
            notification_type=n_type
        )
    except Exception as e:
        print(f"Notification error: {e}")



    # =========================
    # SEND WHATSAPP
    # =========================

    clients = existing_case.clients if (existing_case and hasattr(existing_case, 'clients') and existing_case.clients) else ([existing_case.client] if (existing_case and existing_case.client) else [])


    for client in clients:
        if client and client.phone_number:

            message = f"""
LEGAL HEARING SCHEDULED

Case:
{existing_case.case_title}

Date:
{new_hearing.hearing_date}

Location:
{new_hearing.location}

Status:
{new_hearing.status}
"""

            try:

                send_whatsapp_message(
                    client.phone_number,
                    message
                )

                print(
                    "WHATSAPP SENT"
                )

            except Exception as e:

                print(
                    "WHATSAPP ERROR:",
                    e
                )




    return {

        "message":
        "Hearing scheduled successfully",

        "hearing_id":
        new_hearing.id
    }



# =========================
# UPCOMING HEARINGS
# =========================

@router.get("/upcoming")
def upcoming_hearings(

    limit: int = 10,

    db: Session = Depends(get_db),

    user_data: dict = Depends(verify_token)

):

    role = user_data.get("role")
    user_id = user_data.get("user_id")

    query = db.query(Hearing).join(Case)
    if role == "lawyer":
        query = query.filter(Case.lawyer_id == user_id)
    elif role == "admin":
        from app.models.user_model import User
        assistant_ids = [u.id for u in db.query(User).filter(User.admin_id == user_id).all()]
        query = query.filter(Case.lawyer_id.in_([user_id] + assistant_ids))

    hearings = query.filter(

        Hearing.hearing_date >= datetime.utcnow()

    ).order_by(

        Hearing.hearing_date.asc()

    ).limit(limit).all()


    results = []


    for hearing in hearings:

        case = db.query(Case).filter(
            Case.id == hearing.case_id
        ).first()


        title = f"Case #{hearing.case_id}"

        if case:

            title = case.case_title


        results.append({

            "id":
            hearing.id,

            "title":
            title,

            "case_id":
            hearing.case_id,

            "case_number":
            case.case_number if case else None,

            "case_title":
            case.case_title if case else None,

            "hearing_date":
            hearing.hearing_date.isoformat()
            if hearing.hearing_date
            else None,

            "location":
            hearing.location,

            "status":
            hearing.status
        })


    return results



# =========================
# CALENDAR EVENTS
# =========================

@router.get("/calendar")
def hearing_calendar(

    month: int,

    year: int,

    db: Session = Depends(get_db),

    user_data: dict = Depends(verify_token)

):

    role = user_data.get("role")
    user_id = user_data.get("user_id")

    query = db.query(Hearing).join(Case)
    if role == "lawyer":
        query = query.filter(Case.lawyer_id == user_id)
    elif role == "admin":
        from app.models.user_model import User
        assistant_ids = [u.id for u in db.query(User).filter(User.admin_id == user_id).all()]
        query = query.filter(Case.lawyer_id.in_([user_id] + assistant_ids))

    hearings = query.filter(

        extract(
            "month",
            Hearing.hearing_date
        ) == month,

        extract(
            "year",
            Hearing.hearing_date
        ) == year

    ).all()


    events = []


    for hearing in hearings:

        case = db.query(Case).filter(
            Case.id == hearing.case_id
        ).first()


        title = f"Case #{hearing.case_id}"

        if case:

            title = case.case_title


        events.append({

            "id":
            hearing.id,

            "title":
            title,

            "case_id":
            hearing.case_id,

            "case_number":
            case.case_number if case else None,

            "case_title":
            case.case_title if case else None,

            "start":
            hearing.hearing_date.isoformat()
            if hearing.hearing_date
            else None,

            "extendedProps": {

                "location":
                hearing.location,

                "status":
                hearing.status,

                "case_id":
                hearing.case_id,

                "case_number":
                case.case_number if case else None,

                "case_title":
                case.case_title if case else None
            }
        })


    return events



# =========================
# GET ALL HEARINGS
# =========================

@router.get("/")
def get_hearings(
    date: Optional[str] = Query(None),
    client_name: Optional[str] = Query(None),
    case_number: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user_data: dict = Depends(verify_token)
):

    role = user_data.get("role")
    user_id = user_data.get("user_id")

    query = db.query(Hearing).join(Case)
    if role == "lawyer":
        query = query.filter(Case.lawyer_id == user_id)
    elif role == "admin":
        from app.models.user_model import User
        assistant_ids = [u.id for u in db.query(User).filter(User.admin_id == user_id).all()]
        query = query.filter(Case.lawyer_id.in_([user_id] + assistant_ids))

    if date:
        from sqlalchemy import func
        try:
            date_obj = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(func.date(Hearing.hearing_date) == date_obj)
        except ValueError:
            pass

    if client_name:
        from app.models.client_model import Client
        from sqlalchemy import or_
        query = query.filter(
            or_(
                Case.client.has(Client.client_name.ilike(f"%{client_name}%")),
                Case.clients.any(Client.client_name.ilike(f"%{client_name}%"))
            )
        )

    if case_number:
        query = query.filter(Case.case_number.ilike(f"%{case_number}%"))

    hearings = query.order_by(

        Hearing.hearing_date.asc()

    ).all()


    results = []


    for hearing in hearings:

        case = db.query(Case).filter(
            Case.id == hearing.case_id
        ).first()


        title = f"Case #{hearing.case_id}"

        if case:

            title = case.case_title


        results.append({

            "id":
            hearing.id,

            "title":
            title,

            "case_id":
            hearing.case_id,

            "case_number":
            case.case_number if case else None,

            "case_title":
            case.case_title if case else None,

            "hearing_date":
            hearing.hearing_date.isoformat()
            if hearing.hearing_date
            else None,

            "location":
            hearing.location,

            "status":
            hearing.status
        })


    return results



# =========================
# UPDATE HEARING
# =========================

@router.put("/{hearing_id}")
async def update_hearing(

    hearing_id: int,

    updated_data: HearingCreate,

    db: Session = Depends(get_db),

    user_data: dict = Depends(verify_token)

):

    # Validate required fields
    if not updated_data.case_id:
        raise HTTPException(status_code=400, detail="case_id is required")
    if not updated_data.hearing_date:
        raise HTTPException(status_code=400, detail="hearing_date is required")
    if not updated_data.location:
        raise HTTPException(status_code=400, detail="location is required")

    hearing = db.query(Hearing).filter(Hearing.id == hearing_id).first()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")

    existing_case = db.query(Case).filter(Case.id == updated_data.case_id).first()
    if not existing_case:
        raise HTTPException(status_code=404, detail="Case not found")

    role = user_data.get("role")
    user_id = user_data.get("user_id")

    from app.models.user_model import User
    assistant_ids = [u.id for u in db.query(User).filter(User.admin_id == user_id).all()]
    allowed_lawyers = [user_id] + assistant_ids

    # Verify original hearing case ownership
    original_case = db.query(Case).filter(Case.id == hearing.case_id).first()
    if original_case:
        if (role == "lawyer" and original_case.lawyer_id != user_id) or (role == "admin" and original_case.lawyer_id not in allowed_lawyers):
            raise HTTPException(status_code=403, detail="Access denied")

    # Verify target case ownership
    if (role == "lawyer" and existing_case.lawyer_id != user_id) or (role == "admin" and existing_case.lawyer_id not in allowed_lawyers):
        raise HTTPException(status_code=403, detail="Access denied")

    old_date = hearing.hearing_date
    old_status = hearing.status

    hearing.case_id = updated_data.case_id
    hearing.hearing_date = updated_data.hearing_date
    hearing.location = updated_data.location
    hearing.status = updated_data.status or "Scheduled"

    try:
        db.commit()
        db.refresh(hearing)
    except IntegrityError as ie:
        db.rollback()
        print(f"Database integrity error during hearing update: {ie}")
        raise HTTPException(status_code=400, detail="Database integrity error: invalid data provided.")
    except Exception as e:
        db.rollback()
        print(f"Error during hearing update: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while updating the hearing.")


    # Determine Status change notification
    if hearing.status != old_status:
        if hearing.status == "Cancelled":
            title, message, n_type = "Hearing Cancelled", f"Case {existing_case.case_title} hearing has been cancelled.", "Cancellation"
        elif hearing.status == "Completed":
            title, message, n_type = "Hearing Completed", f"Case {existing_case.case_title} hearing has been completed.", "Completion"
        else:
            title, message, n_type = "Hearing Updated", f"Case {existing_case.case_title} details updated.", "Update"
    else:
        title, message, n_type = "Hearing Rescheduled", f"Case {existing_case.case_title} hearing rescheduled.", "Reschedule"


    # =========================
    # TIMELINE EVENT
    # =========================

    create_timeline_event(

        db=db,

        case_id=existing_case.id,

        title=title,

        description=f"""

Old Date:
{old_date}

New Date:
{hearing.hearing_date}

Location:
{hearing.location}

Status:
{hearing.status}

        """
    )



    # =========================
    # CREATE NOTIFICATION
    # =========================

    # Removed stray incomplete system notification call
    message_body = f"""
Case:
{existing_case.case_title}

Old Date:
{old_date}

New Date:
{hearing.hearing_date}

Location:
{hearing.location}

Status:
{hearing.status}
"""

    await create_system_notification(

        db=db,

        user_id=user_data["user_id"],

        title=title,

        message=message_body,

        notification_type=n_type
    )



    # =========================
    # SEND WHATSAPP
    # =========================

    clients = existing_case.clients if (existing_case and hasattr(existing_case, 'clients') and existing_case.clients) else ([existing_case.client] if (existing_case and existing_case.client) else [])


    for client in clients:
        if client and client.phone_number:

            message = f"""
LEGAL HEARING UPDATED

Case:
{existing_case.case_title}

Old Date:
{old_date}

New Date:
{hearing.hearing_date}

Location:
{hearing.location}

Status:
{hearing.status}
"""

            try:

                send_whatsapp_message(
                    client.phone_number,
                    message
                )

                print(
                    "WHATSAPP UPDATE SENT"
                )

            except Exception as e:

                print(
                    "WHATSAPP UPDATE ERROR:",
                    e
                )




    return {

        "message":
        "Hearing updated successfully"
    }



# =========================
# DELETE HEARING
# =========================

@router.delete("/{hearing_id}")
async def delete_hearing(

    hearing_id: int,

    db: Session = Depends(get_db),

    user_data: dict = Depends(verify_token)

):

    hearing = db.query(Hearing).filter(
        Hearing.id == hearing_id
    ).first()


    if not hearing:

        raise HTTPException(

            status_code=404,

            detail="Hearing not found"
        )

    role = user_data.get("role")
    user_id = user_data.get("user_id")
    case = db.query(Case).filter(Case.id == hearing.case_id).first()
    if case:
        if role == "lawyer" and case.lawyer_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        elif role == "admin":
            from app.models.user_model import User
            assistant_ids = [u.id for u in db.query(User).filter(User.admin_id == user_id).all()]
            if case.lawyer_id not in [user_id] + assistant_ids:
                raise HTTPException(status_code=403, detail="Access denied")


    hearing_location = hearing.location

    hearing_case_id = hearing.case_id

    hearing_db_id = hearing.id



    # =========================
    # TIMELINE EVENT
    # =========================

    create_timeline_event(

        db=db,

        case_id=hearing_case_id,

        title="Hearing Deleted",

        description=f"""

Location:
{hearing_location}

Hearing removed successfully.

        """
    )



    # =========================
    # NOTIFICATION
    # =========================

    await create_system_notification(

        db=db,

        user_id=user_data["user_id"],

        title="Hearing Deleted",

        message=f"""

Hearing ID:
{hearing_db_id}

Location:
{hearing_location}

        """,

        notification_type="Delete"
    )



    db.delete(hearing)

    db.commit()



    return {

        "message":
        "Hearing deleted successfully"
    }
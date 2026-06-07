from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.orm import Session

from datetime import datetime

from app.database import SessionLocal

from app.models.case_model import (
    Case
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

from app.services.auth_service import verify_token


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
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
# DASHBOARD ANALYTICS
# =========================

@router.get("/")
def get_dashboard_data(
    db: Session = Depends(get_db),
    user_data: dict = Depends(verify_token)
):

    role = user_data.get("role")
    user_id = user_data.get("user_id")

    case_query = db.query(Case)
    hearing_query = db.query(Hearing)
    doc_query = db.query(Document)

    if role == "lawyer":
        case_query = case_query.filter(Case.lawyer_id == user_id)
        hearing_query = hearing_query.join(Case).filter(Case.lawyer_id == user_id)
        doc_query = doc_query.join(Case).filter(Case.lawyer_id == user_id)

    total_cases = case_query.count()
    active_cases = case_query.filter(Case.case_status == "Active").count()
    closed_cases = case_query.filter(Case.case_status == "Closed").count()
    pending_cases = case_query.filter(Case.case_status == "Pending").count()

    total_hearings = hearing_query.count()
    upcoming_hearings = hearing_query.filter(Hearing.hearing_date >= datetime.utcnow()).count()

    total_documents = doc_query.count()

    total_notifications = db.query(
        Notification
    ).filter(

        Notification.user_id == user_id

    ).count()

    recent_cases_query = case_query.order_by(
        Case.id.desc()
    ).limit(5).all()

    recent_cases = []

    for case in recent_cases_query:

        recent_cases.append({

            "id":
            case.id,

            "title":
            case.case_title,

            "case_number":
            case.case_number,

            "status":
            case.case_status,

            "lawyer_id":
            case.lawyer_id,

        })



    # =========================
    # RECENT NOTIFICATIONS
    # =========================

    recent_notifications_query = db.query(
        Notification
    ).filter(

        Notification.user_id == user_data["user_id"]

    ).order_by(

        Notification.id.desc()

    ).limit(5).all()


    recent_notifications = []


    for notification in recent_notifications_query:

        recent_notifications.append({

            "id":
            notification.id,

            "title":
            notification.title,

            "message":
            notification.message,

            "type":
            notification.type,

            "is_read":
            notification.is_read
        })



    # =========================
    # SUCCESS RATE
    # =========================

    success_rate = 0


    if total_cases > 0:

        success_rate = (

            closed_cases / total_cases

        ) * 100



    # =========================
    # FINAL RESPONSE
    # =========================

    return {

        "analytics": {

            "total_cases":
            total_cases,

            "active_cases":
            active_cases,

            "closed_cases":
            closed_cases,

            "pending_cases":
            pending_cases,

            "total_hearings":
            total_hearings,

            "upcoming_hearings":
            upcoming_hearings,

            "total_documents":
            total_documents,

            "total_notifications":
            total_notifications,

            "success_rate":
            round(success_rate, 2)
        },

        "recent_cases":
        recent_cases,

        "recent_notifications":
        recent_notifications
    }
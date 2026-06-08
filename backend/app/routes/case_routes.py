from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)

from sqlalchemy.orm import Session
from sqlalchemy import or_

from typing import Optional, List

from app.database import SessionLocal

from app.models.case_model import (
    Case
)

from app.models.client_model import (
    Client
)


from app.models.notification_model import (
    Notification
)

from app.models.hearing_model import (
    Hearing
)

from app.models.document_model import (
    Document
)

from app.models.timeline_model import (
    TimelineEvent
)

from app.schemas.case_schema import (
    CaseCreate,
    CaseUpdate,
    CaseResponse
)

from app.services.auth_service import (
    verify_token
)

from app.services.timeline_service import (
    create_timeline_event
)


router = APIRouter(
    prefix="/cases",
    tags=["Cases"]
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
# CREATE CASE
# =========================

@router.post("/")
def create_case(

    case: CaseCreate,

    db: Session = Depends(get_db),

    user_data: dict = Depends(verify_token)
):

    role = user_data.get("role")
    user_id = user_data.get("user_id")
    assigned_lawyer_id = user_id if role == "lawyer" else case.lawyer_id

    clients_to_associate = []

    if case.clients:
        if len(case.clients) > 15:
            raise HTTPException(status_code=400, detail="Maximum of 15 clients can be added for one case.")
        for c_data in case.clients:
            if not c_data.client_name:
                continue
            existing_client = db.query(Client).filter(
                Client.client_name == c_data.client_name,
                Client.mobile_number == c_data.mobile_number
            ).first()
            if existing_client:
                clients_to_associate.append(existing_client)
            else:
                new_client = Client(
                    client_name=c_data.client_name,
                    mobile_number=c_data.mobile_number
                )
                db.add(new_client)
                db.commit()
                db.refresh(new_client)
                clients_to_associate.append(new_client)
    elif case.client_name:
        existing_client = db.query(Client).filter(
            Client.client_name == case.client_name,
            Client.mobile_number == case.client_mobile
        ).first()
        if existing_client:
            clients_to_associate.append(existing_client)
        else:
            new_client = Client(
                client_name=case.client_name,
                mobile_number=case.client_mobile
            )
            db.add(new_client)
            db.commit()
            db.refresh(new_client)
            clients_to_associate.append(new_client)

    primary_client_id = clients_to_associate[0].id if clients_to_associate else case.client_id

    new_case = Case(
        case_title=case.case_title,
        case_description=case.case_description,
        case_number=case.case_number,
        lawyer_id=assigned_lawyer_id,
        client_id=primary_client_id,
        case_status="Open"
    )
    if clients_to_associate:
        new_case.clients = clients_to_associate

    db.add(new_case)
    db.commit()
    db.refresh(new_case)


    # =========================
    # TIMELINE EVENT
    # =========================
    create_timeline_event(
        db=db,
        case_id=new_case.id,
        title="Case Created",
        description=f"""
        Case:
        {new_case.case_title}

        Status:
        {new_case.case_status}

        Lawyer ID:
        {new_case.lawyer_id}
        """
    )

    # No client notification since client role removed



    return {

        "message":
        "Case created successfully",

        "case_id":
        new_case.id
    }



# =========================
# GET ALL CASES
# =========================

@router.get("/", response_model=List[CaseResponse])
def get_cases(

    skip: int = Query(0),

    limit: int = Query(100),

    db: Session = Depends(get_db),

    user_data: dict = Depends(verify_token)
):

    role = user_data.get("role")

    user_id = user_data.get("user_id")

    query = db.query(Case)



    # ADMIN
    if role == "admin":
        pass

    # LAWYER
    elif role == "lawyer":
        query = query.filter(Case.lawyer_id == user_id)

    # No client role; skip client filter

    cases = query.order_by(

        Case.id.desc()

    ).offset(skip).limit(limit).all()
    return [CaseResponse.from_orm(c) for c in cases]



# =========================
# GET SINGLE CASE
# =========================

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(

    case_id: int,

    db: Session = Depends(get_db),

    user_data: dict = Depends(verify_token)
):

    role = user_data.get("role")
    user_id = user_data.get("user_id")

    case = db.query(Case).filter(
        Case.id == case_id
    ).first()


    if not case:

        raise HTTPException(

            status_code=404,

            detail="Case not found"
        )

    if role != "admin" and case.lawyer_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return case



# =========================
# UPDATE CASE
# =========================

@router.put("/{case_id}")
def update_case(

    case_id: int,

    updated_case: CaseUpdate,

    db: Session = Depends(get_db),

    user_data: dict = Depends(verify_token)
):

    role = user_data.get("role")
    user_id = user_data.get("user_id")

    case = db.query(Case).filter(
        Case.id == case_id
    ).first()


    if not case:

        raise HTTPException(

            status_code=404,

            detail="Case not found"
        )

    if role != "admin" and case.lawyer_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )



    # UPDATE FIELDS
    if updated_case.case_title is not None:

        case.case_title = updated_case.case_title


    if updated_case.case_number is not None:

        case.case_number = updated_case.case_number


    if updated_case.case_description is not None:

        case.case_description = updated_case.case_description


    if updated_case.case_status is not None:

        case.case_status = updated_case.case_status


    if role == "admin":
        if updated_case.lawyer_id is not None:
            case.lawyer_id = updated_case.lawyer_id
        if updated_case.client_id is not None:
            case.client_id = updated_case.client_id

    if updated_case.clients is not None:
        if len(updated_case.clients) > 15:
            raise HTTPException(status_code=400, detail="Maximum of 15 clients can be added for one case.")
        clients_to_associate = []
        for c_data in updated_case.clients:
            if not c_data.client_name:
                continue
            existing_client = db.query(Client).filter(
                Client.client_name == c_data.client_name,
                Client.mobile_number == c_data.mobile_number
            ).first()
            if existing_client:
                clients_to_associate.append(existing_client)
            else:
                new_client = Client(
                    client_name=c_data.client_name,
                    mobile_number=c_data.mobile_number
                )
                db.add(new_client)
                db.commit()
                db.refresh(new_client)
                clients_to_associate.append(new_client)
        case.clients = clients_to_associate
        if role == "admin" and clients_to_associate:
            case.client_id = clients_to_associate[0].id
        elif role != "admin" and clients_to_associate and case.client_id is None:
            case.client_id = clients_to_associate[0].id
    else:
        if updated_case.client_name is not None or updated_case.client_mobile is not None:
            if case.client:
                if updated_case.client_name is not None:
                    case.client.client_name = updated_case.client_name
                if updated_case.client_mobile is not None:
                    case.client.mobile_number = updated_case.client_mobile
            else:
                name = updated_case.client_name or ""
                mobile = updated_case.client_mobile
                existing_client = db.query(Client).filter(
                    Client.client_name == name,
                    Client.mobile_number == mobile
                ).first()
                if existing_client:
                    if role == "admin" or case.client_id is None:
                        case.client_id = existing_client.id
                else:
                    new_client = Client(
                        client_name=name,
                        mobile_number=mobile
                    )
                    db.add(new_client)
                    db.commit()
                    db.refresh(new_client)
                    if role == "admin" or case.client_id is None:
                        case.client_id = new_client.id


    


    db.commit()

    db.refresh(case)



    # =========================
    # TIMELINE EVENT
    # =========================

    create_timeline_event(

        db=db,

        case_id=case.id,

        title="Case Updated",

        description=f"""

Case updated successfully.

Status:
{case.case_status}

Lawyer ID:
{case.lawyer_id}

        """
    )



    # =========================
    # LAWYER NOTIFICATION
    # =========================

    if updated_case.lawyer_id is not None:

        lawyer_notification = Notification(

            user_id=updated_case.lawyer_id,

            title="Case Assigned",

            message=f"You have been assigned to case: {case.case_title}",

            type="case"
        )

        db.add(lawyer_notification)

        db.commit()



    # =========================
    # Client notifications removed; client role no longer exists



    return {

        "message":
        "Case updated successfully"
    }



# =========================
# DELETE CASE
# =========================

@router.delete("/{case_id}")
def delete_case(

    case_id: int,

    db: Session = Depends(get_db),

    user_data: dict = Depends(verify_token)
):

    role = user_data.get("role")
    user_id = user_data.get("user_id")

    case = db.query(Case).filter(
        Case.id == case_id
    ).first()


    if not case:

        raise HTTPException(

            status_code=404,

            detail="Case not found"
        )

    if role != "admin" and case.lawyer_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )



    case_title = case.case_title



    # DELETE RELATED HEARINGS
    db.query(Hearing).filter(
        Hearing.case_id == case_id
    ).delete()




    # DELETE RELATED DOCUMENTS
    db.query(Document).filter(
        Document.case_id == case_id
    ).delete()



    # DELETE RELATED TIMELINE EVENTS
    db.query(TimelineEvent).filter(
        TimelineEvent.case_id == case_id
    ).delete()



    # DELETE CASE
    db.delete(case)

    db.commit()



    return {

        "message":
        f"Case '{case_title}' deleted successfully"
    }



@router.get("/search/")
def search_cases(
    title: Optional[str] = None,
    status: Optional[str] = None,
    lawyer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user_data: dict = Depends(verify_token)
):

    role = user_data.get("role")
    user_id = user_data.get("user_id")

    query = db.query(Case)

    if role == "lawyer":
        query = query.filter(Case.lawyer_id == user_id)

    if title:

        query = query.filter(

            Case.case_title.ilike(
                f"%{title}%"
            )
        )



    if status:

        query = query.filter(
            Case.case_status == status
        )

    return query.order_by(
        Case.id.desc()
    ).all()



# =========================
# ADVANCED SEARCH
# =========================

@router.get("/advanced-search/")
def advanced_search(

    query: str,

    db: Session = Depends(get_db),

    user_data: dict = Depends(verify_token)
):

    role = user_data.get("role")
    user_id = user_data.get("user_id")

    base_query = db.query(Case)

    if role == "lawyer":
        base_query = base_query.filter(Case.lawyer_id == user_id)

    cases = base_query.filter(

        or_(

            Case.case_title.ilike(
                f"%{query}%"
            ),

            Case.case_description.ilike(
                f"%{query}%"
            ),

            Case.case_status.ilike(
                f"%{query}%"
            )
        )

    ).order_by(

        Case.id.desc()

    ).all()


    return cases
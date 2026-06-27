from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.work_model import Work
from app.models.user_model import User
from app.schemas.work_schema import WorkCreate, WorkUpdate, WorkResponse
from app.services.auth_service import verify_token

router = APIRouter(
    prefix="/works",
    tags=["Works"]
)

@router.post("/", response_model=WorkResponse)
def create_work(
    work: WorkCreate,
    db: Session = Depends(get_db),
    user_data: dict = Depends(verify_token)
):
    if user_data.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin lawyers can assign work."
        )
    
    # Verify assistant exists and belongs to this admin
    assistant = db.query(User).filter(User.id == work.assigned_to_id, User.admin_id == user_data["user_id"]).first()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assigned assistant not found or not managed by you.")

    new_work = Work(
        title=work.title,
        description=work.description,
        due_date=work.due_date,
        assigned_to_id=work.assigned_to_id,
        created_by_id=user_data["user_id"],
        status="Pending"
    )
    db.add(new_work)
    db.commit()
    db.refresh(new_work)
    
    # Construct response with names
    creator = db.query(User).filter(User.id == new_work.created_by_id).first()
    return WorkResponse(
        id=new_work.id,
        title=new_work.title,
        description=new_work.description,
        due_date=new_work.due_date,
        status=new_work.status,
        assigned_to_id=new_work.assigned_to_id,
        created_by_id=new_work.created_by_id,
        assigned_to_name=assistant.full_name,
        created_by_name=creator.full_name if creator else "Unknown"
    )

@router.get("/", response_model=List[WorkResponse])
def get_works(
    db: Session = Depends(get_db),
    user_data: dict = Depends(verify_token)
):
    role = user_data.get("role")
    user_id = user_data.get("user_id")
    
    if role == "admin":
        # Admin gets only works they created
        works = db.query(Work).filter(Work.created_by_id == user_id).all()
    else:
        # Assistant gets only assigned works
        works = db.query(Work).filter(Work.assigned_to_id == user_id).all()
        
    res = []
    for w in works:
        assigned = db.query(User).filter(User.id == w.assigned_to_id).first()
        creator = db.query(User).filter(User.id == w.created_by_id).first()
        res.append(WorkResponse(
            id=w.id,
            title=w.title,
            description=w.description,
            due_date=w.due_date,
            status=w.status,
            assigned_to_id=w.assigned_to_id,
            created_by_id=w.created_by_id,
            assigned_to_name=assigned.full_name if assigned else "Unknown",
            created_by_name=creator.full_name if creator else "Unknown"
        ))
    return res

@router.put("/{work_id}", response_model=WorkResponse)
def update_work(
    work_id: int,
    work_update: WorkUpdate,
    db: Session = Depends(get_db),
    user_data: dict = Depends(verify_token)
):
    role = user_data.get("role")
    user_id = user_data.get("user_id")
    
    work = db.query(Work).filter(Work.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
        
    # Check permissions:
    # Admin can change anything (for works they created).
    # Assistant (lawyer) can only change the status of their assigned work.
    if role == "lawyer" and work.assigned_to_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    elif role == "admin" and work.created_by_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    if role == "admin":
        if work_update.title is not None:
            work.title = work_update.title
        if work_update.description is not None:
            work.description = work_update.description
        if work_update.due_date is not None:
            work.due_date = work_update.due_date
        if work_update.assigned_to_id is not None:
            # Verify new assistant exists and belongs to this admin
            assistant = db.query(User).filter(User.id == work_update.assigned_to_id, User.admin_id == user_id).first()
            if not assistant:
                raise HTTPException(status_code=404, detail="Assigned assistant not found or not managed by you.")
            work.assigned_to_id = work_update.assigned_to_id
            
    # Both admin and assistant can update the status
    if work_update.status is not None:
        work.status = work_update.status
        
    db.commit()
    db.refresh(work)
    
    assigned = db.query(User).filter(User.id == work.assigned_to_id).first()
    creator = db.query(User).filter(User.id == work.created_by_id).first()
    return WorkResponse(
        id=work.id,
        title=work.title,
        description=work.description,
        due_date=work.due_date,
        status=work.status,
        assigned_to_id=work.assigned_to_id,
        created_by_id=work.created_by_id,
        assigned_to_name=assigned.full_name if assigned else "Unknown",
        created_by_name=creator.full_name if creator else "Unknown"
    )

@router.delete("/{work_id}")
def delete_work(
    work_id: int,
    db: Session = Depends(get_db),
    user_data: dict = Depends(verify_token)
):
    if user_data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete works")
        
    work = db.query(Work).filter(Work.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
        
    # Verify the work was created by this admin
    if work.created_by_id != user_data["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    db.delete(work)
    db.commit()
    return {"message": "Work deleted successfully"}

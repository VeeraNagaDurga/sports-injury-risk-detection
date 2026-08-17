from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from database import models
from services import chat_service
from services.auth_service import get_current_user

router = APIRouter(tags=["Chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    AI assistant endpoint - available to every role EXCEPT Administrator.
    Enforced HERE, not just by hiding the widget in the frontend, so a
    determined admin user can't reach it by calling the API directly -
    same "never trust the frontend alone" principle used everywhere else
    in this app (e.g. the Revoke Account endpoint).
    """
    if current_user.role == "Administrator":
        raise HTTPException(
            status_code=403,
            detail="The AI assistant is not available for Administrator accounts.",
        )

    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        reply = chat_service.get_chat_reply(
            db=db,
            user=current_user,
            message=message,
            history=[m.model_dump() for m in body.history],
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return {"reply": reply}
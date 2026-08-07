from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/menu", tags=["Menu Management"])

# 1. GET /api/menu - Get all menu items
@router.get("", response_model=List[schemas.MenuItemResponse])
def get_menu_items(available_only: Optional[bool] = False, db: Session = Depends(get_db)):
    query = db.query(models.MenuItem)
    if available_only:
        query = query.filter(models.MenuItem.is_available == True)
    return query.all()

# 2. POST /api/menu - Add a new menu item
@router.post("", response_model=schemas.MenuItemResponse, status_code=status.HTTP_201_CREATED)
def create_menu_item(item: schemas.MenuItemCreate, db: Session = Depends(get_db)):
    db_item = models.MenuItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# 3. PUT /api/menu/{item_id} - Update an existing menu item (or toggle availability)
@router.put("/{item_id}", response_model=schemas.MenuItemResponse)
def update_menu_item(item_id: int, item_update: schemas.MenuItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail=f"Menu item with ID {item_id} not found")

    # Update only fields provided in payload
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)
    return db_item

# 4. DELETE /api/menu/{item_id} - Delete a menu item
@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail=f"Menu item with ID {item_id} not found")

    db.delete(db_item)
    db.commit()
    return None

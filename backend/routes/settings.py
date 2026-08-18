from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api", tags=["Settings & Categories"])

# Default categories to seed database if empty
DEFAULT_CATEGORIES = [
    'Vada Pav', 'Dabeli', 'Pizza', 'Burger', 'Sandwich',
    'Fries & Snacks', 'Beverages', 'Desserts', 'Combos'
]

# --- CATEGORIES ENDPOINTS ---

@router.get("/categories", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(models.Category).all()
    # Seed default categories if database is empty
    if not categories:
        for cat_name in DEFAULT_CATEGORIES:
            db.add(models.Category(name=cat_name))
        db.commit()
        categories = db.query(models.Category).all()
    return categories

@router.post("/categories", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category_in: schemas.CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Category).filter(models.Category.name == category_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    new_cat = models.Category(name=category_in.name)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.delete("/categories/{category_id}", status_code=status.HTTP_200_OK)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"message": "Category deleted successfully"}


# --- APP SETTINGS ENDPOINTS ---

@router.get("/settings", response_model=schemas.AppSettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    platform_charge_setting = db.query(models.AppSetting).filter(models.AppSetting.key == "platform_charge").first()
    delivery_fee_setting = db.query(models.AppSetting).filter(models.AppSetting.key == "delivery_fee").first()
    store_open_setting = db.query(models.AppSetting).filter(models.AppSetting.key == "is_store_open").first()

    return schemas.AppSettingsResponse(
        platform_charge=float(platform_charge_setting.value) if platform_charge_setting else 5.0,
        delivery_fee=float(delivery_fee_setting.value) if delivery_fee_setting else 0.0,
        is_store_open=store_open_setting.value.lower() == "true" if store_open_setting else True
    )

@router.put("/settings", response_model=schemas.AppSettingsResponse)
def update_settings(settings_in: schemas.AppSettingsUpdate, db: Session = Depends(get_db)):
    settings_dict = {
        "platform_charge": str(settings_in.platform_charge),
        "delivery_fee": str(settings_in.delivery_fee),
        "is_store_open": str(settings_in.is_store_open).lower(),
    }

    for key, val in settings_dict.items():
        setting_obj = db.query(models.AppSetting).filter(models.AppSetting.key == key).first()
        if setting_obj:
            setting_obj.value = val
        else:
            db.add(models.AppSetting(key=key, value=val))

    db.commit()

    return schemas.AppSettingsResponse(
        platform_charge=settings_in.platform_charge,
        delivery_fee=settings_in.delivery_fee,
        is_store_open=settings_in.is_store_open
    )

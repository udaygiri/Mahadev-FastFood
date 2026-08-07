from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# 1. Nested Customer Details Schema
class CustomerSchema(BaseModel):
    name: str = Field(..., example="User Name")
    phone: str = Field(..., example="9876543210")
    address: str = Field(..., example="Junagadh, Gujarat")


# 2. Nested Order Item Schema
class OrderItemSchema(BaseModel):
    id: str = Field(..., example="1")
    name: str = Field(..., example="Special Cheese Pizza")
    price: float = Field(..., gt=0, example=299.0)
    quantity: int = Field(..., gt=0, example=1)


# 3. Nested Bill Breakdown Schema
class BillBreakdownSchema(BaseModel):
    itemTotal: float = Field(..., ge=0, example=299.0)
    deliveryFee: float = Field(default=0.0, ge=0, example=0.0)
    platformCharge: float = Field(default=5.0, ge=0, example=5.0)
    grandTotal: float = Field(..., gt=0, example=304.0)


# 4. Request Payload Schema (Incoming from Frontend POST request)
class OrderCreate(BaseModel):
    orderId: str = Field(..., example="MHF-102938")
    customer: CustomerSchema
    items: List[OrderItemSchema]
    cookingInstructions: Optional[str] = Field(default=None, example="Extra Spicy")
    paymentMethod: str = Field(default="cod", example="cod")
    billBreakdown: BillBreakdownSchema
    status: str = Field(default="Placed", example="Placed")


# 5. Status Update Request Payload Schema (PATCH request)
class OrderStatusUpdate(BaseModel):
    status: str = Field(..., example="Preparing")


# 6. Response Payload Schema (Outgoing response back to Frontend)
class OrderResponse(OrderCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True  # Allows Pydantic to read SQLAlchemy ORM models directly


# 7. Menu Item Schemas
class MenuItemBase(BaseModel):
    name: str = Field(..., example="Special Cheese Pizza")
    category: str = Field(..., example="Pizza")
    price: float = Field(..., gt=0, example=299.0)
    image: Optional[str] = Field(default=None, example="https://images.unsplash.com/photo-...")
    description: Optional[str] = Field(default=None, example="Loaded with fresh mozzarella cheese.")
    is_available: bool = Field(default=True, example=True)


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    image: Optional[str] = None
    description: Optional[str] = None
    is_available: Optional[bool] = None


class MenuItemResponse(MenuItemBase):
    id: int

    class Config:
        from_attributes = True
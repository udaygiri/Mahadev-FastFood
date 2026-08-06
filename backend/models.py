from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, ForeignKey, Column, DateTime
from sqlalchemy.orm import relationship
from database import Base

class Order(Base):

    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(String, unique=True, index=True, nullable=False) # e.g. MHF-102938
    
    # Customer Details
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    customer_address = Column(String, nullable=False)

    # Order Meta & Payment
    cooking_instructions = Column(String, nullable=True)
    payment_method = Column(String, default="cod") # 'cod' or 'online'
    status = Column(String, default="Placed") # 'Placed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'

    # Bill Breakdown
    item_total = Column(Float, nullable=False)
    delivery_fee = Column(Float, default=0.0)
    platform_charge = Column(Float, default=5.0)
    grand_total = Column(Float, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship to Order Items (One-to-Many)
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    item_id = Column(String, nullable=False) # e.g. item ID from frontend
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    # Relationship back to Order
    order = relationship("Order", back_populates="items")
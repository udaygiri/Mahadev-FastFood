from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/api/orders",
    tags=["Orders"]
)


# 1. Create a New Order (POST /api/orders)
@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    # Check if order_id already exists
    existing_order = db.query(models.Order).filter(models.Order.order_id == order_data.orderId).first()
    if existing_order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order ID '{order_data.orderId}' already exists."
        )

    # Map Pydantic payload to SQLAlchemy Order Model
    new_order = models.Order(
        order_id=order_data.orderId,
        customer_name=order_data.customer.name,
        customer_phone=order_data.customer.phone,
        customer_address=order_data.customer.address,
        cooking_instructions=order_data.cookingInstructions,
        payment_method=order_data.paymentMethod,
        status=order_data.status,
        item_total=order_data.billBreakdown.itemTotal,
        delivery_fee=order_data.billBreakdown.deliveryFee,
        platform_charge=order_data.billBreakdown.platformCharge,
        grand_total=order_data.billBreakdown.grandTotal
    )

    db.add(new_order)
    db.flush() # Flushes transaction to generate new_order.id (primary key)

    # Create associated OrderItems
    for item in order_data.items:
        db_item = models.OrderItem(
            order_id=new_order.id,
            item_id=item.id,
            name=item.name,
            price=item.price,
            quantity=item.quantity
        )
        db.add(db_item)

    # Commit both Order & Items together in a single transaction
    db.commit()
    db.refresh(new_order)

    # Reconstruct nested fields for response match
    return schemas.OrderResponse(
        id=new_order.id,
        orderId=new_order.order_id,
        customer=schemas.CustomerSchema(
            name=new_order.customer_name,
            phone=new_order.customer_phone,
            address=new_order.customer_address
        ),
        items=[
            schemas.OrderItemSchema(
                id=item.item_id,
                name=item.name,
                price=item.price,
                quantity=item.quantity
            ) for item in new_order.items
        ],
        cookingInstructions=new_order.cooking_instructions,
        paymentMethod=new_order.payment_method,
        billBreakdown=schemas.BillBreakdownSchema(
            itemTotal=new_order.item_total,
            deliveryFee=new_order.delivery_fee,
            platformCharge=new_order.platform_charge,
            grandTotal=new_order.grand_total
        ),
        status=new_order.status,
        created_at=new_order.created_at
    )


# 2. Get All Orders (GET /api/orders)
@router.get("/", response_model=List[schemas.OrderResponse])
def get_all_orders(db: Session = Depends(get_db)):
    orders = db.query(models.Order).order_by(models.Order.created_at.desc()).all()
    
    response_list = []
    for order in orders:
        response_list.append(
            schemas.OrderResponse(
                id=order.id,
                orderId=order.order_id,
                customer=schemas.CustomerSchema(
                    name=order.customer_name,
                    phone=order.customer_phone,
                    address=order.customer_address
                ),
                items=[
                    schemas.OrderItemSchema(
                        id=item.item_id,
                        name=item.name,
                        price=item.price,
                        quantity=item.quantity
                    ) for item in order.items
                ],
                cookingInstructions=order.cooking_instructions,
                paymentMethod=order.payment_method,
                billBreakdown=schemas.BillBreakdownSchema(
                    itemTotal=order.item_total,
                    deliveryFee=order.delivery_fee,
                    platformCharge=order.platform_charge,
                    grandTotal=order.grand_total
                ),
                status=order.status,
                created_at=order.created_at
            )
        )
    return response_list


# 3. Update Order Status (PATCH /api/orders/{order_id}/status)
@router.patch("/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: str,
    status_data: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' not found"
        )
    
    order.status = status_data.status
    db.commit()
    db.refresh(order)

    return schemas.OrderResponse(
        id=order.id,
        orderId=order.order_id,
        customer=schemas.CustomerSchema(
            name=order.customer_name,
            phone=order.customer_phone,
            address=order.customer_address
        ),
        items=[
            schemas.OrderItemSchema(
                id=item.item_id,
                name=item.name,
                price=item.price,
                quantity=item.quantity
            ) for item in order.items
        ],
        cookingInstructions=order.cooking_instructions,
        paymentMethod=order.payment_method,
        billBreakdown=schemas.BillBreakdownSchema(
            itemTotal=order.item_total,
            deliveryFee=order.delivery_fee,
            platformCharge=order.platform_charge,
            grandTotal=order.grand_total
        ),
        status=order.status,
        created_at=order.created_at
    )

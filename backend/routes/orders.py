from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
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

    # Extract lat/lng from customer object or top-level payload
    lat_val = order_data.lat or (order_data.customer.lat if order_data.customer else None)
    lng_val = order_data.lng or (order_data.customer.lng if order_data.customer else None)

    # Map Pydantic payload to SQLAlchemy Order Model
    new_order = models.Order(
        order_id=order_data.orderId,
        customer_name=order_data.customer.name,
        customer_phone=order_data.customer.phone,
        customer_address=order_data.customer.address,
        lat=lat_val,
        lng=lng_val,
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
            address=new_order.customer_address,
            lat=new_order.lat,
            lng=new_order.lng
        ),
        lat=new_order.lat,
        lng=new_order.lng,
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
        driver_name=new_order.driver_name,
        driver_phone=new_order.driver_phone,
        created_at=new_order.created_at
    )


# 2. Get Orders (GET /api/orders?phone=...)
@router.get("/", response_model=List[schemas.OrderResponse])
def get_all_orders(phone: Optional[str] = Query(None, description="Optional customer phone number to filter orders"), db: Session = Depends(get_db)):
    query = db.query(models.Order)
    if phone:
        query = query.filter(models.Order.customer_phone == phone)
    
    orders = query.order_by(models.Order.created_at.desc()).all()
    
    response_list = []
    for order in orders:
        response_list.append(
            schemas.OrderResponse(
                id=order.id,
                orderId=order.order_id,
                customer=schemas.CustomerSchema(
                    name=order.customer_name,
                    phone=order.customer_phone,
                    address=order.customer_address,
                    lat=order.lat,
                    lng=order.lng
                ),
                lat=order.lat,
                lng=order.lng,
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
                driver_name=order.driver_name,
                driver_phone=order.driver_phone,
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
    
    if status_data.status:
        order.status = status_data.status
    if status_data.driver_name:
        order.driver_name = status_data.driver_name
    if status_data.driver_phone:
        order.driver_phone = status_data.driver_phone

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
        driver_name=order.driver_name,
        driver_phone=order.driver_phone,
        created_at=order.created_at
    )


# 4. Delete an Order (DELETE /api/orders/{order_id})
@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' not found"
        )
    
    db.delete(order)
    db.commit()
    return None

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routes import orders, menu

# Automatically create tables in database (for local dev)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(debug=True,
              title="Mahadev Fast Food",
              description="Backend API for Mahadev Fast Food ordering system",
              version="1.0.0")

# Configure CORS for Frontend React & Mobile Integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Health Check Route
@app.get("/")
def read_root():
    return {"message": "Welcome to Mahadev Fast Food API!"}

app.include_router(orders.router)
app.include_router(menu.router)




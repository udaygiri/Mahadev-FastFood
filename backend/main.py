from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine

# Automatically create tables in database (for local dev)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(debug=True,
              title="Mahadev Fast Food",
              description="Backend API for Mahadev Fast Food ordering system",
              version="1.0.0")

# Configure CORS for Frontend React integration
origins = [
    "http://localhost:5173",  # React Vite dev server
    "http://localhost:3000",  # Alternative React dev port
]

app.add_middleware(CORSMiddleware,
                   allow_origins=origins,
                   allow_headers=["*"],  # Allows GET, POST, PUT, DELETE, etc.
                   allow_methods=["*"]) # Allows all request headers

# Root Health Check Route
@app.get("/")
def read_root():
    return {"message": "Welcome to Mahadev Fast Food API!"}

from routes import orders

app.include_router(orders.router)



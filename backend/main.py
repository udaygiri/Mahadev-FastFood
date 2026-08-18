from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routes import orders, menu, settings

app = FastAPI(
    debug=True,
    title="Mahadev Fast Food",
    description="Backend API for Mahadev Fast Food ordering system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Safely create tables on startup
@app.on_event("startup")
def startup_db_client():
    try:
        models.Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"DB Startup Warning: {e}")

# Root Health Check Route
@app.get("/")
def read_root():
    return {"message": "Welcome to Mahadev Fast Food API!"}

app.include_router(orders.router)
app.include_router(menu.router)
app.include_router(settings.router)





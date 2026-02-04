from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .services import endpoints

app = FastAPI(title="Gravity Audio Intelligence", version="1.0.0")

# CORS middleware to allow connection from React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Gravity Systems Operational", "status": "online"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

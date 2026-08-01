from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.routes.auth import router as auth_router
from app.api.routes.investor import router as investor_router
from app.api.routes.admin import router as admin_router

app = FastAPI(title="BLACKBUSER API", version="1.0.0")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(investor_router, prefix="/investor", tags=["investor"])
app.include_router(admin_router, prefix="/admin", tags=["admin"])


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "BLACKBUSER API is running", "docs": "/docs"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}

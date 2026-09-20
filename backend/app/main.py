from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from .db import create_db_and_tables, ensure_case_columns
from .observability import init_tracer
from .seed import seed
from .routers import auth as auth_router
from .routers import assistant as assistant_router
from .routers import cases as cases_router
from .routers import portal as portal_router
from .routers import applicant as applicant_router
from .routers import operator as operator_router
from .routers import places as places_router
from .config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    try:
        ensure_case_columns()
    except Exception as e:
        print(f"[lifespan] case migration skipped: {e}")
    try:
        seed()
    except Exception as e:
        print(f"[lifespan] seed failed: {e}")
    init_tracer(settings.CODEXRAY_SERVICE, settings.CODEXRAY_URL, settings.CODEXRAY_API_KEY)
    yield

app = FastAPI(title="GramIntel API", version="0.1.0", description="GramIntel — Hyper-local Business Advisory & Financial Structuring", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(assistant_router.router)
app.include_router(cases_router.router)
app.include_router(portal_router.router)
app.include_router(applicant_router.router)
app.include_router(operator_router.router)
app.include_router(places_router.router)

def _is_prod():
    return settings.ENV == "prod"

from fastapi.security import HTTPBearer
from .deps import get_optional_user

security_opt = HTTPBearer(auto_error=False)

def docs_guard(request: Request, user=Depends(get_optional_user)):
    if _is_prod():
        if not user or getattr(user, "role", None) != "officer":
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Docs available to officers only")
    return user

@app.get("/openapi.json", include_in_schema=False)
def openapi_json(user=Depends(docs_guard)):
    return JSONResponse(get_openapi(title=app.title, version=app.version, description=app.description, routes=app.routes))

@app.get("/docs", include_in_schema=False)
def swagger_docs(user=Depends(docs_guard)):
    return get_swagger_ui_html(openapi_url="/openapi.json", title=f"{app.title} - Swagger")

@app.get("/redoc", include_in_schema=False)
def redoc_docs(user=Depends(docs_guard)):
    return get_redoc_html(openapi_url="/openapi.json", title=f"{app.title} - ReDoc")

@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}

@app.get("/")
def root():
    return {"message": "GramIntel API — see /docs", "health": "/health", "docs": "/docs"}

@app.exception_handler(Exception)
async def global_exc_handler(request: Request, exc: Exception):
    from fastapi import HTTPException
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    print(f"[error] {request.url} -> {exc}")
    return JSONResponse(status_code=500, content={"detail": str(exc)})

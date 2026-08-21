"""API v1 router — aggregates all endpoint routers."""
from fastapi import APIRouter
from app.api.v1 import schema, queries, analysis, auth

api_router = APIRouter()

api_router.include_router(auth.router,     tags=["Auth"])
api_router.include_router(schema.router,   tags=["Schema"])
api_router.include_router(queries.router,  tags=["Queries"])
api_router.include_router(analysis.router, tags=["Analysis"])


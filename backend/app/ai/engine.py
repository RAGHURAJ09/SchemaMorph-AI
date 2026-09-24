"""
AI Analysis Engine (LangChain)
Uses LangChain and Gemini to generate service names, rationale, and query fix suggestions.
"""
import os
from typing import List, Optional
from pydantic import BaseModel, Field

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.exceptions import OutputParserException

from app.ai.prompts import get_analysis_prompt, format_clusters, format_queries

# ── Pydantic Schemas for LangChain Output Parser ─────────────────────────────

class AIServiceDef(BaseModel):
    cluster_id: int
    service_name: str = Field(description="PascalCase name ending in Service")
    rationale: str = Field(description="2-3 sentences explaining the boundaries")
    responsibilities: List[str] = Field(description="List of 2-3 responsibilities")

class AIAffectedQuery(BaseModel):
    query_id: str
    is_broken: bool
    broken_joins: List[str] = Field(default_factory=list)
    fix_pattern: str = Field(description="Architectural fix pattern")
    fix_description: str = Field(description="Explanation of the fix")

class AIAnalysisResult(BaseModel):
    services: List[AIServiceDef]
    affected_queries: List[AIAffectedQuery] = Field(default_factory=list)
    general_recommendations: List[str] = Field(default_factory=list)


def run_analysis(
    cluster_summaries: list,
    query_analyses: list,
    schema_metadata: dict,
) -> dict:
    """
    Call Gemini API via LangChain to generate service boundaries.
    """
    from dotenv import load_dotenv, find_dotenv
    load_dotenv(find_dotenv(), override=True)  # Ensure .env is read and overrides stale vars

    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not api_key:
        return _fallback(cluster_summaries, query_analyses, reason="No API key provided in .env")

    # Initialize LangChain LLM
    llm = ChatGoogleGenerativeAI(
        model="gemini-3.5-flash",
        temperature=0.2,
        google_api_key=api_key,
        max_output_tokens=4096,
        timeout=8,
        max_retries=0,
    )

    # Initialize Parser
    parser = PydanticOutputParser(pydantic_object=AIAnalysisResult)

    # Build Prompt
    prompt = get_analysis_prompt()
    
    # Create the Chain
    chain = prompt | llm | parser

    # Prepare Inputs
    inputs = {
        "format_instructions": parser.get_format_instructions(),
        "table_count": schema_metadata.get("table_count", 0),
        "fk_count": schema_metadata.get("fk_count", 0),
        "cluster_count": len(cluster_summaries),
        "clusters_text": format_clusters(cluster_summaries),
        "queries_text": format_queries(query_analyses),
    }

    try:
        # Execute the chain
        result: AIAnalysisResult = chain.invoke(inputs)
        
        # Convert to dict and append metadata
        result_dict = result.dict()
        result_dict["ai_used"] = True
        result_dict["model"] = "gemini-1.5-flash (langchain)"
        return result_dict

    except OutputParserException as e:
        return _fallback(cluster_summaries, query_analyses, reason=f"LangChain parsing failed: {e}")
    except Exception as e:
        return _fallback(cluster_summaries, query_analyses, reason=str(e))


# ── Fallback ─────────────────────────────────────────────────────────────────

def _fallback(cluster_summaries: list, query_analyses: list, reason: str = "") -> dict:
    """
    Return a structurally valid response without AI narration.
    """
    services = []
    for cluster in cluster_summaries:
        cid = cluster["cluster_id"]
        letter = chr(65 + cid)
        tables_preview = ", ".join(cluster["tables"][:4])
        services.append({
            "cluster_id": cid,
            "service_name": f"Service{letter}",
            "rationale": (
                f"Cluster {cid} contains {cluster['table_count']} tables "
                f"({tables_preview}{'...' if len(cluster['tables']) > 4 else ''}) "
                f"with {cluster.get('intra_fk_count', 0)} internal relationships."
            ),
            "responsibilities": [
                f"Manages data for: {', '.join(cluster['tables'][:3])}"
            ],
        })

    return {
        "services": services,
        "affected_queries": [],
        "general_recommendations": [
            "AI analysis unavailable. Graph-based clustering completed successfully.",
            f"Reason: {reason}" if reason else "",
        ],
        "ai_used": False,
        "fallback_reason": reason,
    }

import asyncio
import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
import fitz  # PyMuPDF
from sqlalchemy import select
from backend.database import AsyncSessionLocal
from backend.models.material import Material, DocumentChunk
from backend.models.concept import Concept
from backend.models.activity import ActivityEvent
from backend.models.job import BackgroundJob
from backend.ai.providers import get_embedding_provider
from backend.ai.vector_store import vector_store

logger = logging.getLogger("backend.jobs")

def chunk_text(text: str, chunk_size: int = 600, overlap: int = 120):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += (chunk_size - overlap)
    return chunks

async def process_material_pipeline(material_id: str, project_id: str, file_path: str):
    """
    Executes the 5-stage document processing pipeline asynchronously:
    uploading -> extracting_text -> creating_knowledge -> preparing_search -> ready
    """
    embedding_provider = get_embedding_provider()
    
    async with AsyncSessionLocal() as db:
        # Load material
        result = await db.execute(select(Material).where(Material.id == material_id))
        material = result.scalar_one_or_none()
        if not material:
            return

        try:
            # Stage 1: extracting_text
            material.status = "processing"
            material.stage = "extracting_text"
            await db.commit()
            
            # Small yield to let event loop notify UI polling
            await asyncio.sleep(0.3)

            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")

            doc = fitz.open(file_path)
            total_pages = len(doc)
            material.pages_count = total_pages

            pages_text = []
            for page_idx in range(total_pages):
                page = doc.load_page(page_idx)
                txt = page.get_text("text")
                pages_text.append((page_idx + 1, txt))

            total_text = " ".join(t for _, t in pages_text).strip()
            if not total_text:
                material.status = "failed"
                material.stage = "extracting_text"
                material.error_message = "The document appears to be a scanned image without a readable text layer."
                await db.commit()
                return

            # Stage 2: creating_knowledge
            material.stage = "creating_knowledge"
            await db.commit()
            await asyncio.sleep(0.3)

            extracted_concepts_set = set()
            # Heuristic concept extraction: capitalize phrases, common tech terms
            tech_patterns = re.findall(r"\b[A-Z][a-zA-Z]{3,}(?:\s+[A-Z][a-zA-Z]+)?\b", total_text)
            for tp in tech_patterns[:15]:
                if len(tp) > 4 and tp.lower() not in ["chapter", "section", "figure", "table", "university", "introduction"]:
                    extracted_concepts_set.add(tp.strip())

            if not extracted_concepts_set:
                extracted_concepts_set = {"Core Principles", "System Architecture", "Evaluation"}

            concepts_list = list(extracted_concepts_set)[:6]
            material.concepts_extracted = concepts_list

            # Chunking and embedding
            chunk_records = []
            chunk_counter = 0

            for page_num, text in pages_text:
                page_chunks = chunk_text(text)
                for c_txt in page_chunks:
                    chunk_counter += 1
                    emb = embedding_provider.embed_text(c_txt)
                    chunk_id = f"chk_{uuid.uuid4().hex[:12]}"
                    
                    doc_chunk = DocumentChunk(
                        id=chunk_id,
                        material_id=material.id,
                        project_id=project_id,
                        chunk_index=chunk_counter,
                        page_number=page_num,
                        content=c_txt,
                        token_count=len(c_txt.split()),
                        embedding_json=json.dumps(emb),
                        metadata_json={"filename": material.filename, "page": page_num},
                    )
                    db.add(doc_chunk)
                    chunk_records.append((chunk_id, page_num, c_txt, emb))

            # Stage 3: preparing_search
            material.stage = "preparing_search"
            await db.commit()
            await asyncio.sleep(0.3)

            # Register in vector index
            for cid, page_num, c_txt, emb in chunk_records:
                vector_store.add_chunk(
                    project_id=project_id,
                    chunk_id=cid,
                    material_id=material.id,
                    material_name=material.filename,
                    page_number=page_num,
                    content=c_txt,
                    embedding=emb,
                )

            # Also register concepts in DB if they don't exist
            for c_name in concepts_list:
                c_res = await db.execute(
                    select(Concept).where(Concept.project_id == project_id, Concept.name == c_name)
                )
                if not c_res.scalar_one_or_none():
                    new_concept = Concept(
                        id=f"c_{uuid.uuid4().hex[:10]}",
                        project_id=project_id,
                        name=c_name,
                        description=f"Core concept extracted from {material.filename}",
                        mastery=50.0,
                        trend="flat",
                        status="improving",
                    )
                    db.add(new_concept)

            # Stage 4: ready
            material.status = "ready"
            material.stage = "ready"
            material.searchable = True
            
            # Log Activity
            event = ActivityEvent(
                id=f"ev_{uuid.uuid4().hex[:12]}",
                user_id=material.project.user_id if material.project else "system",
                project_id=project_id,
                project_name=material.filename,
                event_type="MATERIAL_PROCESSED",
                summary=f"{material.filename} processed successfully ({total_pages} pages, {len(chunk_records)} chunks)",
                metadata_json={"material_id": material.id, "pages": total_pages},
            )
            db.add(event)

            await db.commit()

        except Exception as e:
            logger.exception(f"Error processing material {material_id}: {e}")
            material.status = "failed"
            material.error_message = str(e)
            await db.commit()

def enqueue_material_processing(material_id: str, project_id: str, file_path: str):
    """Launches the pipeline in the background."""
    asyncio.create_task(process_material_pipeline(material_id, project_id, file_path))

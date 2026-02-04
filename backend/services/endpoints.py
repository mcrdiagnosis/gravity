from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import tempfile
from .transcription import transcribe_audio
from .gravity_core import analyze_transcript
from ..models.analysis import GravityAnalysisResult

router = APIRouter()

@router.post("/analyze", response_model=GravityAnalysisResult)
async def upload_and_analyze(file: UploadFile = File(...)):
    """
    1. Uploads audio file.
    2. Transcribes it.
    3. Analyzes it with Gravity.
    4. Returns structured result.
    """
    # Create a temporary file to save the upload
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_file_path = temp_file.name

    try:
        # Step 1: Transcribe
        print(f"Transcribing {file.filename}...")
        transcript_text = transcribe_audio(temp_file_path)
        
        # Step 2: Analyze
        print("Analyzing transcript...")
        analysis_result = analyze_transcript(transcript_text)
        
        return analysis_result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Cleanup
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

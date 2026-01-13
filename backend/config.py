"""
Configuration management for the Radiological AI Assistant
"""
import os
import torch
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
FAISS_INDEX_DIR = DATA_DIR / "faiss_index"

# Create directories if they don't exist
DATA_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)
FAISS_INDEX_DIR.mkdir(exist_ok=True)

# Device configuration
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[CONFIG] Using device: {DEVICE}")

# Model configurations
MODEL_CONFIG = {
    "vision": {
        "model_name": "densenet121-res224-all",
        "confidence_threshold": 0.5,
    },
    "rag": {
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
        "top_k": 3,
        "index_path": str(FAISS_INDEX_DIR / "medical_reports.index"),
        "metadata_path": str(FAISS_INDEX_DIR / "metadata.pkl"),
    },
    "llm": {
        "model_name": "medalpaca/medalpaca-7b",
        "max_new_tokens": 512,
        "temperature": 0.7,
        "top_p": 0.9,
        "load_in_4bit": True,
    }
}

# API configurations
API_CONFIG = {
    "host": "0.0.0.0",
    "port": 8000,
    "max_file_size": 10 * 1024 * 1024,  # 10MB
    "allowed_extensions": {".jpg", ".jpeg", ".png"},
}

# Dataset configuration
DATASET_CONFIG = {
    "kaggle_dataset": "raddar/chest-xrays-indiana-university",
    "reports_filename": "indiana_reports.csv",
}

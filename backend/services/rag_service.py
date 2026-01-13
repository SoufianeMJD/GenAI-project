"""
RAG Service - Retrieval Augmented Generation for Medical Reports
Uses FAISS for efficient similarity search and sentence-transformers for embeddings
"""
import os
import pickle
import pandas as pd
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from pathlib import Path
import kagglehub

from config import MODEL_CONFIG, DATASET_CONFIG, FAISS_INDEX_DIR


class RAGService:
    def __init__(self):
        self.embedding_model = None
        self.index = None
        self.reports = []
        self.metadata = []
        self.index_path = MODEL_CONFIG["rag"]["index_path"]
        self.metadata_path = MODEL_CONFIG["rag"]["metadata_path"]
        self.top_k = MODEL_CONFIG["rag"]["top_k"]
        self.dataset_path = None
        
    def load_embedding_model(self):
        """Load the sentence transformer model for embeddings"""
        if self.embedding_model is None:
            print("[RAG] Loading embedding model...")
            model_name = MODEL_CONFIG["rag"]["embedding_model"]
            self.embedding_model = SentenceTransformer(model_name)
            print(f"[RAG] Embedding model loaded: {model_name}")
    
    def download_dataset(self):
        """Download the Indiana University dataset using kagglehub"""
        print("[RAG] Downloading Indiana University Chest X-rays dataset...")
        try:
            path = kagglehub.dataset_download(DATASET_CONFIG["kaggle_dataset"])
            self.dataset_path = Path(path)
            print(f"[RAG] Dataset downloaded to: {path}")
            
            # List all files in the dataset
            print("[RAG] Dataset contents:")
            for item in self.dataset_path.rglob("*"):
                if item.is_file():
                    print(f"  - {item.relative_to(self.dataset_path)}")
            
            return path
        except Exception as e:
            print(f"[RAG] Error downloading dataset: {str(e)}")
            raise
    
    def find_reports_file(self):
        """Find the reports CSV file in the downloaded dataset"""
        if self.dataset_path is None:
            self.download_dataset()
        
        # Common filenames for Indiana reports
        possible_names = [
            "indiana_reports.csv",
            "reports.csv",
            "indiana_projections.csv",
            "projections.csv"
        ]
        
        for csv_file in self.dataset_path.rglob("*.csv"):
            print(f"[RAG] Found CSV: {csv_file.name}")
            if any(name.lower() in csv_file.name.lower() for name in possible_names):
                print(f"[RAG] Using reports file: {csv_file}")
                return csv_file
        
        # If no specific file found, use the first CSV with 'findings' or 'impression' columns
        for csv_file in self.dataset_path.rglob("*.csv"):
            try:
                df = pd.read_csv(csv_file, nrows=1)
                if 'findings' in df.columns or 'impression' in df.columns:
                    print(f"[RAG] Using reports file: {csv_file}")
                    return csv_file
            except:
                continue
        
        raise FileNotFoundError("Could not find reports CSV with 'findings' or 'impression' columns")
    
    def ingest_data(self, csv_path: str = None):
        """
        Ingest medical reports from CSV and create FAISS index
        
        Args:
            csv_path: Path to CSV file (if None, will auto-download)
        """
        self.load_embedding_model()
        
        # Get the CSV path
        if csv_path is None:
            csv_path = self.find_reports_file()
        
        print(f"[RAG] Reading reports from: {csv_path}")
        
        # Read the CSV
        df = pd.read_csv(csv_path)
        print(f"[RAG] Loaded {len(df)} reports")
        print(f"[RAG] Columns: {list(df.columns)}")
        
        # Combine findings and impression into full reports
        reports = []
        metadata = []
        
        for idx, row in df.iterrows():
            # Build report text
            report_parts = []
            
            if 'findings' in df.columns and pd.notna(row['findings']):
                report_parts.append(f"Findings: {row['findings']}")
            
            if 'impression' in df.columns and pd.notna(row['impression']):
                report_parts.append(f"Impression: {row['impression']}")
            
            # Skip if no content
            if not report_parts:
                continue
            
            full_report = "\n".join(report_parts)
            reports.append(full_report)
            
            # Store metadata
            metadata.append({
                "index": idx,
                "findings": row.get('findings', ''),
                "impression": row.get('impression', ''),
            })
        
        print(f"[RAG] Processed {len(reports)} valid reports")
        
        # Generate embeddings
        print("[RAG] Generating embeddings...")
        embeddings = self.embedding_model.encode(
            reports,
            show_progress_bar=True,
            convert_to_numpy=True
        )
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)
        
        # Create FAISS index
        print("[RAG] Building FAISS index...")
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # Inner Product for cosine similarity
        self.index.add(embeddings)
        
        self.reports = reports
        self.metadata = metadata
        
        # Save index and metadata
        print(f"[RAG] Saving index to: {self.index_path}")
        faiss.write_index(self.index, self.index_path)
        
        with open(self.metadata_path, 'wb') as f:
            pickle.dump({
                'reports': self.reports,
                'metadata': self.metadata
            }, f)
        
        print(f"[RAG] Index created with {self.index.ntotal} reports")
        return True
    
    def load_index(self):
        """Load existing FAISS index from disk"""
        if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
            print("[RAG] Loading existing index...")
            self.index = faiss.read_index(self.index_path)
            
            with open(self.metadata_path, 'rb') as f:
                data = pickle.load(f)
                self.reports = data['reports']
                self.metadata = data['metadata']
            
            self.load_embedding_model()
            print(f"[RAG] Index loaded with {self.index.ntotal} reports")
            return True
        return False
    
    def retrieve(self, query: str, top_k: int = None) -> list:
        """
        Retrieve most similar reports based on query
        
        Args:
            query: Search query (typically detected pathologies)
            top_k: Number of results to return
            
        Returns:
            list of dicts with report text and metadata
        """
        if top_k is None:
            top_k = self.top_k
        
        # Ensure index is loaded
        if self.index is None:
            if not self.load_index():
                print("[RAG] No index found, ingesting data...")
                self.ingest_data()
        
        if self.embedding_model is None:
            self.load_embedding_model()
        
        # Encode query
        query_embedding = self.embedding_model.encode([query], convert_to_numpy=True)
        faiss.normalize_L2(query_embedding)
        
        # Search
        distances, indices = self.index.search(query_embedding, top_k)
        
        # Prepare results
        results = []
        for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            results.append({
                "rank": i + 1,
                "similarity": float(dist),
                "report": self.reports[idx],
                "metadata": self.metadata[idx]
            })
        
        return results


# Singleton instance
rag_service = RAGService()


if __name__ == "__main__":
    # Test the service
    print("Testing RAG Service...")
    rag_service.ingest_data()
    
    # Test retrieval
    results = rag_service.retrieve("Cardiomegaly and Edema")
    print(f"\nRetrieved {len(results)} similar cases:")
    for result in results:
        print(f"\nRank {result['rank']} (Similarity: {result['similarity']:.3f})")
        print(result['report'][:200] + "...")

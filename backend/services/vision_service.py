"""
Vision Service - X-Ray Pathology Detection using TorchXRayVision
"""
import torch
import torchxrayvision as xrv
import numpy as np
from PIL import Image
from skimage import io, transform
import warnings
warnings.filterwarnings('ignore')

from config import DEVICE, MODEL_CONFIG


class VisionService:
    def __init__(self):
        self.model = None
        self.device = DEVICE
        self.confidence_threshold = MODEL_CONFIG["vision"]["confidence_threshold"]
        
    def load_model(self):
        """Load the TorchXRayVision DenseNet model"""
        try:
            print("[VISION] Loading DenseNet121 model...")
            self.model = xrv.models.DenseNet(weights="densenet121-res224-all")
            self.model = self.model.to(self.device)
            self.model.eval()
            print(f"[VISION] Model loaded successfully on {self.device}")
            print(f"[VISION] Pathology labels: {self.model.pathologies}")
            return True
        except RuntimeError as e:
            if "out of memory" in str(e).lower():
                print("[VISION] GPU OOM detected, falling back to CPU")
                self.device = "cpu"
                self.model = xrv.models.DenseNet(weights="densenet121-res224-all")
                self.model = self.model.to(self.device)
                self.model.eval()
                return True
            else:
                raise e
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Preprocess image for TorchXRayVision model
        - Convert to grayscale
        - Resize to 224x224
        - Normalize
        """
        try:
            # Read image
            img = io.imread(image_path)
            
            # Convert to grayscale if needed
            if len(img.shape) == 3:
                img = img.mean(axis=2)
            
            # Resize to 224x224
            img = transform.resize(img, (224, 224))
            
            # Normalize to [-1024, 1024] range (standard for X-rays)
            img = (img - img.min()) / (img.max() - img.min()) * 2048 - 1024
            
            # Add batch and channel dimensions
            img = img[np.newaxis, np.newaxis, :, :]
            
            return img.astype(np.float32)
            
        except Exception as e:
            raise ValueError(f"Failed to preprocess image: {str(e)}")
    
    def predict(self, image_path: str) -> dict:
        """
        Predict pathologies from an X-ray image
        
        Args:
            image_path: Path to the X-ray image
            
        Returns:
            dict: {
                "pathologies": [{"name": str, "confidence": float}, ...],
                "detected_count": int,
                "image_processed": bool
            }
        """
        if self.model is None:
            self.load_model()
        
        try:
            # Preprocess image
            img_tensor = self.preprocess_image(image_path)
            img_tensor = torch.from_numpy(img_tensor).to(self.device)
            
            # Run inference
            with torch.no_grad():
                predictions = self.model(img_tensor)
            
            # Convert predictions to numpy
            predictions = predictions.cpu().numpy()[0]
            
            # Get pathology names
            pathology_names = self.model.pathologies
            
            # Create results
            results = []
            for i, pathology in enumerate(pathology_names):
                confidence = float(predictions[i])
                if confidence >= self.confidence_threshold:
                    results.append({
                        "name": pathology,
                        "confidence": round(confidence, 3)
                    })
            
            # Sort by confidence (descending)
            results.sort(key=lambda x: x["confidence"], reverse=True)
            
            return {
                "pathologies": results,
                "detected_count": len(results),
                "image_processed": True,
                "all_predictions": {
                    pathology: round(float(predictions[i]), 3)
                    for i, pathology in enumerate(pathology_names)
                }
            }
            
        except Exception as e:
            print(f"[VISION] Prediction error: {str(e)}")
            raise
        
        finally:
            # Clear GPU cache if using CUDA
            if self.device == "cuda":
                torch.cuda.empty_cache()


# Singleton instance
vision_service = VisionService()


if __name__ == "__main__":
    # Test the service
    print("Testing Vision Service...")
    vision_service.load_model()
    print("Model loaded successfully!")

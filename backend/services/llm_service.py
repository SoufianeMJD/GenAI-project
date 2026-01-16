"""
LLM Service - Medical Report Generation and Chat
Uses 4-bit quantized medical LLM for memory efficiency
"""
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    pipeline
)
import warnings
warnings.filterwarnings('ignore')

from config import DEVICE, MODEL_CONFIG


class LLMService:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.pipeline = None
        self.device = DEVICE
        self.config = MODEL_CONFIG["llm"]
        
    def load_model(self):
        """Load the medical LLM with 4-bit quantization"""
        try:
            print("[LLM] Loading medical language model...")
            model_name = self.config["model_name"]
            
            # Configure 4-bit quantization
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_use_double_quant=True,
            )
            
            # Load tokenizer
            print(f"[LLM] Loading tokenizer for {model_name}...")
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                trust_remote_code=True
            )
            
            # Set padding token if not exists
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # Load model
            print(f"[LLM] Loading model {model_name} in 4-bit...")
            self.model = AutoModelForCausalLM.from_pretrained(
                model_name,
                quantization_config=bnb_config,
                device_map="auto",
                trust_remote_code=True,
                torch_dtype=torch.float16,
            )
            
            self.model.eval()
            print(f"[LLM] Model loaded successfully")
            
            # Create text generation pipeline
            self.pipeline = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                max_new_tokens=self.config["max_new_tokens"],
                temperature=self.config["temperature"],
                top_p=self.config["top_p"],
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id,
            )
            
            return True
            
        except RuntimeError as e:
            if "out of memory" in str(e).lower():
                print("[LLM] GPU OOM detected")
                print("[LLM] Try reducing model size or using a smaller model")
                raise MemoryError("Insufficient GPU memory for LLM. Consider using a smaller model or adding more VRAM.")
            else:
                raise e
        except Exception as e:
            print(f"[LLM] Error loading model: {str(e)}")
            raise
    
    def construct_report_prompt(self, findings: list, rag_context: str) -> str:
        """
        Construct a medical prompt for report generation
        
        Args:
            findings: List of detected pathologies
            rag_context: Similar case reports from RAG
            
        Returns:
            Formatted prompt string
        """
        findings_str = ", ".join([f"{f['name']} ({f['confidence']:.2f})" for f in findings])
        
        prompt = f"""You are an expert radiologist writing a professional chest X-ray report.

**Detected Findings:**
{findings_str}

**Similar Historical Cases:**
{rag_context}

**Task:** Generate a structured radiology report with the following sections:

1. FINDINGS: Describe the observed pathologies in detail
2. IMPRESSION: Provide clinical interpretation
3. RECOMMENDATIONS: Suggest follow-up actions if needed

Write in professional medical language. Be concise but thorough.

**REPORT:**
"""
        return prompt
    
    def construct_chat_prompt(self, history: list, user_input: str, case_context: str = "") -> str:
        """
        Construct a chat prompt with conversation history
        
        Args:
            history: List of previous messages
            user_input: Current user question
            case_context: Current case information
            
        Returns:
            Formatted prompt string
        """
        system_prompt = """You are a medical AI assistant helping doctors understand radiology reports. 
Answer questions clearly and professionally. Base your responses on medical knowledge and the current case."""
        
        if case_context:
            system_prompt += f"\n\n**Current Case:**\n{case_context}"
        
        prompt = f"{system_prompt}\n\n"
        
        # Add conversation history without adding extra role labels
        # (the frontend already handles showing roles)
        for msg in history[-6:]:  # Keep last 6 messages for context
            content = msg.get("content", "")
            prompt += f"{content}\n\n"
        
        prompt += f"{user_input}\n\nAssistant:"
        
        return prompt
    
    def generate_report(self, findings: list, rag_context: str) -> str:
        """
        Generate a structured medical report
        
        Args:
            findings: Pathologies detected by vision model
            rag_context: Similar cases from RAG
            
        Returns:
            Generated report text
        """
        if self.model is None:
            self.load_model()
        
        try:
            # Construct prompt
            prompt = self.construct_report_prompt(findings, rag_context)
            
            # Generate
            print("[LLM] Generating report...")
            outputs = self.pipeline(
                prompt,
                max_new_tokens=self.config["max_new_tokens"],
                temperature=self.config["temperature"],
                top_p=self.config["top_p"],
            )
            
            # Extract generated text
            generated_text = outputs[0]["generated_text"]
            
            # Extract only the report part (after the prompt)
            if "**REPORT:**" in generated_text:
                report = generated_text.split("**REPORT:**")[1].strip()
            else:
                report = generated_text[len(prompt):].strip()
            
            return report
            
        except Exception as e:
            print(f"[LLM] Report generation error: {str(e)}")
            raise
        
        finally:
            # Clear cache
            if self.device == "cuda":
                torch.cuda.empty_cache()
    
    def chat(self, history: list, user_input: str, case_context: str = "") -> str:
        """
        Handle conversational queries about the case
        
        Args:
            history: Previous messages
            user_input: User's question
            case_context: Current case information
            
        Returns:
            Assistant's response
        """
        if self.model is None:
            self.load_model()
        
        try:
            # Construct prompt
            prompt = self.construct_chat_prompt(history, user_input, case_context)
            
            # Generate
            print("[LLM] Generating chat response...")
            outputs = self.pipeline(
                prompt,
                max_new_tokens=256,  # Shorter for chat
                temperature=0.7,
                top_p=0.9,
            )
            
            # Extract response
            generated_text = outputs[0]["generated_text"]
            response = generated_text[len(prompt):].strip()
            
            return response
            
        except Exception as e:
            print(f"[LLM] Chat error: {str(e)}")
            raise
        
        finally:
            # Clear cache
            if self.device == "cuda":
                torch.cuda.empty_cache()


# Singleton instance
llm_service = LLMService()


if __name__ == "__main__":
    # Test the service
    print("Testing LLM Service...")
    llm_service.load_model()
    
    # Test report generation
    test_findings = [
        {"name": "Cardiomegaly", "confidence": 0.85},
        {"name": "Edema", "confidence": 0.72}
    ]
    test_context = "Previous case showed similar cardiomegaly with pulmonary congestion."
    
    report = llm_service.generate_report(test_findings, test_context)
    print("\n" + "="*50)
    print("GENERATED REPORT:")
    print("="*50)
    print(report)

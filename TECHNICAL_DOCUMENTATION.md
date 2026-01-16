# Technical Documentation - Multimodal Radiological AI Assistant

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Backend Components](#backend-components)
4. [Frontend Components](#frontend-components)
5. [How to Run the Application](#how-to-run-the-application)
6. [Data Flow](#data-flow)
7. [API Reference](#api-reference)

---

## System Overview

The Multimodal Radiological AI Assistant is a full-stack application that combines computer vision, natural language processing, and retrieval-augmented generation (RAG) to analyze chest X-ray images and generate professional medical reports.

### Key Technologies
- **Backend**: Python 3.11, FastAPI
- **Frontend**: React 18, Vite, TailwindCSS
- **AI Models**: 
  - Vision: TorchXRayVision (DenseNet121)
  - LLM: MedAlpaca-7B (4-bit quantized)
  - Embeddings: all-MiniLM-L6-v2
- **Vector Database**: FAISS
- **Dataset**: Indiana University Chest X-Ray Collection (via Kaggle)

---

## Architecture

### System Diagram

```
┌─────────────────┐
│   React UI      │
│  (Frontend)     │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  FastAPI Server │
│   (Backend)     │
└────────┬────────┘
         │
    ┌────┴────┬────────┬─────────┐
    ▼         ▼        ▼         ▼
┌────────┐ ┌────┐  ┌─────┐  ┌──────┐
│ Vision │ │RAG │  │ LLM │  │Config│
│Service │ │Svc │  │ Svc │  │      │
└────────┘ └────┘  └─────┘  └──────┘
    │         │        │
    ▼         ▼        ▼
┌────────┐ ┌────┐  ┌─────┐
│TorchXR │ │FAISS│ │Med- │
│ayVision│ │Index│ │Alpaca│
└────────┘ └────┘  └─────┘
```

### Three-Service Architecture

1. **Vision Service**: Detects pathologies in X-ray images
2. **RAG Service**: Retrieves similar historical cases from embeddings database
3. **LLM Service**: Generates structured medical reports using context

---

## Backend Components

### 1. Configuration (`backend/config.py`)

Centralized configuration management for all services.

**Key Settings:**
- Device selection (CUDA/CPU)
- Model paths and configurations
- API server settings
- Directory structure

**Important Variables:**
```python
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_CONFIG = {
    "vision": {"model_name": "densenet121-res224-all"},
    "rag": {"embedding_model": "all-MiniLM-L6-v2", "top_k": 3},
    "llm": {"model_name": "medalpaca/medalpaca-7b", "load_in_4bit": True}
}
```

### 2. Vision Service (`backend/services/vision_service.py`)

**Purpose**: Analyzes chest X-ray images to detect pathologies using TorchXRayVision.

**How It Works:**
1. Loads pre-trained DenseNet121 model
2. Preprocesses X-ray images (resize, normalize)
3. Runs inference to predict 18 pathology probabilities
4. Filters predictions above confidence threshold (default: 30%)
5. Returns sorted list of detected findings

**Key Functions:**
- `load_model()`: Initializes the vision model
- `preprocess_image(image_path)`: Prepares image for model input
- `predict(image_path)`: Main prediction pipeline

**Output Format:**
```python
{
    "pathologies": [
        {"name": "Cardiomegaly", "confidence": 0.85},
        {"name": "Edema", "confidence": 0.72}
    ]
}
```

### 3. RAG Service (`backend/services/rag_service.py`)

**Purpose**: Retrieves semantically similar historical cases using FAISS vector search.

**How It Works:**
1. Downloads Indiana University dataset via KaggleHub
2. Loads sentence-transformer embedding model
3. Generates embeddings for all historical reports
4. Builds FAISS index for efficient similarity search
5. On query, embeds search query and retrieves top-k similar cases

**Key Functions:**
- `download_dataset()`: Fetches dataset from Kaggle
- `load_embedding_model()`: Initializes sentence transformer
- `ingest_data()`: Creates FAISS index from dataset
- `retrieve(query, top_k)`: Searches for similar cases

**FAISS Index:**
- Type: IndexFlatL2 (exact search)
- Dimension: 384 (embedding size)
- Dataset size: ~3,826 radiology reports

### 4. LLM Service (`backend/services/llm_service.py`)

**Purpose**: Generates professional medical reports using MedAlpaca-7B with RAG context.

**How It Works:**
1. Loads MedAlpaca-7B with 4-bit quantization (memory efficient)
2. Constructs prompts with:
   - Detected findings from vision model
   - Similar cases from RAG retrieval
   - System instructions for medical reporting
3. Generates structured report with sections (Findings, Impression, Recommendations)
4. Handles chat conversations with case context

**Key Functions:**
- `load_model()`: Initializes LLM with 4-bit quantization
- `generate_report(findings, rag_context)`: Creates medical report
- `chat(history, user_input, case_context)`: Handles Q&A

**4-bit Quantization Benefits:**
- Reduces memory from ~27GB to ~7GB
- Maintains 95%+ accuracy
- Enables GPU usage on consumer hardware

### 5. Main API (`backend/main.py`)

**Purpose**: FastAPI server orchestrating all services and exposing REST endpoints.

**Endpoints:**

1. **POST /analyze** - Analyze X-ray image
   - Accepts: multipart/form-data (image file)
   - Returns: full analysis with findings, report, similar cases
   - Process: Vision → RAG → LLM pipeline

2. **POST /chat** - Chat about current case
   - Accepts: JSON with message, history, context
   - Returns: AI assistant response

3. **GET /status** - Check service status
   - Returns: model load status, index statistics

4. **POST /init-rag** - Manually initialize RAG index
   - Triggers dataset download and indexing

**CORS Configuration:**
- Allows requests from localhost:5173 (Vite dev server)
- Enables credentials and all HTTP methods

---

## Frontend Components

### 1. Application Shell (`frontend/src/App.jsx`)

**Purpose**: Main application component managing global state and layout.

**Key Features:**
- Two-column layout (Image Viewer + Report/Chat tabs)
- Full-width Similar Cases section below
- Proper scrolling hierarchy
- Chat history persistence across tab switches

**State Management:**
```javascript
- currentImage: uploaded X-ray file
- analysisResult: API response with findings/report
- isAnalyzing: loading state
- activeTab: 'report' or 'chat'
- chatHistory: conversation messages
- error: error messages
```

**Layout Structure:**
- Fixed-height header with sticky positioning
- Scrollable main content area
- Two-column grid (700px min-height)
- Similar Cases section (stacked vertically, scrollable)

### 2. Image Viewer (`frontend/src/components/ImageViewer.jsx`)

**Purpose**: Handles X-ray image upload and display with zoom/pan controls.

**Features:**
- Drag-and-drop upload
- File input selection
- Image preview with react-zoom-pan-pinch
- Zoom controls (+, -, reset)

**Supported Formats:** JPEG, PNG, DICOM (via image conversion)

### 3. Report Tab (`frontend/src/components/ReportTab.jsx`)

**Purpose**: Displays AI-generated medical report with detected pathologies.

**Sections:**
1. **Detected Pathologies**: Badge display with confidence levels
   - Critical (≥70%): Red badge
   - Moderate (40-69%): Yellow badge
   - Normal (<40%): Blue badge

2. **AI-Generated Analysis**: Markdown-rendered structured report
   - Findings section
   - Impression
   - Recommendations

3. **Export Options**:
   - Copy to clipboard
   - Export as PDF

**Empty State**: Centered icon and message when no analysis available

### 4. Chat Tab (`frontend/src/components/ChatTab.jsx`)

**Purpose**: Conversational interface for asking questions about the current case.

**Features:**
- Message history with role-based styling
- User messages (right-aligned, blue)
- Assistant messages (left-aligned, with markdown rendering)
- Auto-scroll to latest message
- Suggested questions for new conversations
- Input field sticky at bottom

**Chat Context:**
- Automatically includes current case findings
- Passes abbreviated report (first 500 chars)
- Maintains last 6 messages for conversation flow

### 5. Loading States (`frontend/src/components/LoadingStates.jsx`)

**Purpose**: Multi-stage loading animation during analysis.

**Stages:**
1. Vision Analysis (detecting pathologies)
2. RAG Retrieval (finding similar cases)
3. Report Generation (creating medical report)

**Features:**
- Animated progress indicators
- Stage-specific icons
- Smooth transitions

### 6. Styling (`frontend/src/index.css`)

**Design System:**
- Dark medical theme (navy blue base)
- Glassmorphism effects
- Custom color palette:
  - Accent Blue: #3b82f6
  - Accent Purple: #8b5cf6
  - Success Green: #10b981
  - Warning Red: #ef4444
- Custom scrollbars
- Professional message bubbles
- Responsive badge system

---

## How to Run the Application

### Prerequisites

1. **Python 3.11** (Required for CUDA support)
2. **Node.js 16+** and npm
3. **NVIDIA GPU** (optional, for faster processing)
4. **Kaggle Account** (for dataset access)

### Step 1: Configure Kaggle API

1. Go to Kaggle.com → Account → API → Create New Token
2. Download `kaggle.json`
3. Place in:
   - Windows: `C:\Users\<username>\.kaggle\kaggle.json`
   - Linux/Mac: `~/.kaggle/kaggle.json`

### Step 2: Backend Setup

```powershell
# Navigate to backend directory
cd "e:\Desktop Files\SDIA\S3\GenAI\GenAI Project LLM+RAG\backend"

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows PowerShell
# OR
source venv/bin/activate  # Linux/Mac

# Install PyTorch with CUDA (GPU users)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# OR for CPU only
pip install torch torchvision

# Install remaining dependencies
pip install -r requirements.txt

# Start the backend server
python main.py
```

**Backend will start on:** `http://localhost:8000`

**First Run:** Models and dataset will download automatically:
- LLM model: ~27GB (first time only)
- TorchXRayVision: ~50MB
- Sentence transformers: ~80MB
- Indiana Dataset: ~7GB

### Step 3: Frontend Setup

```powershell
# Navigate to frontend directory (new terminal)
cd "e:\Desktop Files\SDIA\S3\GenAI\GenAI Project LLM+RAG\frontend"

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend will start on:** `http://localhost:5173`

### Step 4: Use the Application

1. Open browser to `http://localhost:5173`
2. Upload a chest X-ray image (drag-drop or click to select)
3. Wait for analysis to complete (30-60 seconds)
4. View generated report in "Report" tab
5. Ask questions in "Assistant" tab
6. Scroll down to see Similar Historical Cases

---

## Data Flow

### Image Analysis Flow

```
1. USER uploads X-ray image
   ↓
2. FRONTEND sends file to /analyze endpoint
   ↓
3. BACKEND Vision Service processes image
   ↓ (pathologies detected)
4. BACKEND RAG Service searches for similar cases
   ↓ (top 3 cases retrieved)
5. BACKEND LLM Service generates report
   ↓ (structured report created)
6. FRONTEND displays results in UI
```

### Chat Flow

```
1. USER types question in chat
   ↓
2. FRONTEND sends message with history to /chat
   ↓
3. BACKEND LLM Service constructs prompt with:
   - Conversation history
   - Current case context (findings + report)
   ↓
4. LLM generates contextual response
   ↓
5. FRONTEND displays response
   ↓
6. Chat history updated (persists across tab switches)
```

---

## API Reference

### POST /analyze

Analyze a chest X-ray image and generate a comprehensive report.

**Request:**
```
Content-Type: multipart/form-data
Body: file (image file)
```

**Response:**
```json
{
  "success": true,
  "findings": [
    {"name": "Cardiomegaly", "confidence": 0.85},
    {"name": "Edema", "confidence": 0.72}
  ],
  "detected_count": 2,
  "similar_cases": [
    {
      "rank": 1,
      "similarity": 0.56,
      "report": "Findings: There are diffuse increased..."
    }
  ],
  "generated_report": "**FINDINGS:** There are diffuse...",
  "processing_time": 35.2
}
```

### POST /chat

Send a message to the AI assistant about the current case.

**Request:**
```json
{
  "history": [
    {"role": "user", "content": "What does this finding mean?"},
    {"role": "assistant", "content": "Cardiomegaly refers to..."}
  ],
  "message": "Is this condition serious?",
  "case_context": "Current case findings: Cardiomegaly (85%)"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Cardiomegaly can indicate various cardiac conditions..."
}
```

### GET /status

Check the status of all services.

**Response:**
```json
{
  "vision_model_loaded": true,
  "rag_index_loaded": true,
  "llm_model_loaded": true,
  "rag_reports_count": 3826
}
```

---

## Performance Considerations

### GPU vs CPU

**With CUDA GPU (NVIDIA Quadro RTX 4000):**
- LLM loading: ~30 seconds
- Report generation: ~10-15 seconds
- Total analysis time: ~30-40 seconds

**CPU Only:**
- LLM loading: ~5-10 minutes
- Report generation: ~60-90 seconds
- Total analysis time: ~2-3 minutes

### Memory Requirements

**GPU Mode:**
- VRAM: 8GB minimum (for 4-bit quantized LLM)
- RAM: 16GB recommended

**CPU Mode:**
- RAM: 32GB minimum

### Optimization Tips

1. **Keep LLM loaded**: Once loaded, keep server running
2. **Use GPU**: Significantly faster inference
3. **Cache results**: Frontend can cache analysis results
4. **Batch processing**: Analyze multiple images in sequence

---

## Troubleshooting

### Backend Issues

**Problem:** `RuntimeError: CUDA out of memory`
- **Solution**: Reduce batch size or use CPU mode

**Problem:** `kagglehub` dataset download fails
- **Solution**: Check `kaggle.json` credentials and internet connection

**Problem:** LLM takes too long to load
- **Solution**: Normal on first run (~10 min CPU, ~30s GPU). Subsequent loads are from cache.

### Frontend Issues

**Problem:** CORS errors in browser console
- **Solution**: Ensure backend is running on port 8000

**Problem:** Chat history disappears when switching tabs
- **Solution**: Fixed in latest version - chat history persists via App state

**Problem:** Similar Cases section overlaps content
- **Solution**: Fixed in latest version - proper scrolling layout implemented

---

## Future Enhancements

1. **Multi-modal support**: Support CT scans, MRIs
2. **User authentication**: Secure access control
3. **Case management**: Save and retrieve past analyses
4. **DICOM support**: Native medical imaging format
5. **Export options**: DOCX, HL7 FHIR formats
6. **Collaborative features**: Share cases with colleagues
7. **Model fine-tuning**: Continue training on institution-specific data

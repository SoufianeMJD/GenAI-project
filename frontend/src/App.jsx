import React, { useState } from 'react';
import { Activity, FileText, MessageSquare } from 'lucide-react';
import ImageViewer from './components/ImageViewer';
import LoadingStates from './components/LoadingStates';
import ReportTab from './components/ReportTab';
import ChatTab from './components/ChatTab';
import { analyzeImage } from './services/api';

function App() {
    const [currentImage, setCurrentImage] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [activeTab, setActiveTab] = useState('report');
    const [currentStage, setCurrentStage] = useState(1);
    const [error, setError] = useState(null);

    const handleImageSelect = async (file) => {
        if (file === null) {
            // Reset state when clearing image
            setCurrentImage(null);
            setAnalysisResult(null);
            setActiveTab('report');
            setError(null);
            return;
        }

        setCurrentImage(file);
        setAnalysisResult(null);
        setError(null);
        setIsAnalyzing(true);
        setCurrentStage(1);

        try {
            // Stage 1: Vision Analysis
            setCurrentStage(1);
            await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback

            // Stage 2: RAG Retrieval
            setCurrentStage(2);
            await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback

            // Stage 3: LLM Generation
            setCurrentStage(3);

            // Call backend API
            const result = await analyzeImage(file);

            if (result.success) {
                setAnalysisResult(result);
                setActiveTab('report');
            } else {
                throw new Error(result.error || 'Analysis failed');
            }
        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.message || 'Failed to analyze image. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-medical-bg-primary flex flex-col">
            {/* Header */}
            <header className="glass-card border-b border-medical-border sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-medical-accent-blue to-medical-accent-purple rounded-lg flex items-center justify-center">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-medical-text-primary">
                                    Multimodal Radiological AI Assistant
                                </h1>
                                <p className="text-sm text-medical-text-secondary">
                                    Advanced Medical Image Analysis with AI
                                </p>
                            </div>
                        </div>

                        {analysisResult && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="badge badge-normal">
                                    {analysisResult.detected_count} findings
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Error Banner */}
            {error && (
                <div className="bg-medical-accent-red/20 border-b border-medical-accent-red/40 px-6 py-3">
                    <p className="text-medical-accent-red text-sm">
                        <strong>Error:</strong> {error}
                    </p>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 container mx-auto p-6">
                <div className="h-full grid grid-cols-2 gap-6">
                    {/* Left Panel - Image Viewer */}
                    <div className="h-[calc(100vh-180px)]">
                        <ImageViewer
                            onImageSelect={handleImageSelect}
                            currentImage={currentImage}
                        />
                    </div>

                    {/* Right Panel - Tabbed Interface */}
                    <div className="h-[calc(100vh-180px)] flex flex-col glass-card overflow-hidden">
                        {/* Tab Headers */}
                        <div className="flex border-b border-medical-border bg-medical-bg-tertiary/30">
                            <button
                                onClick={() => setActiveTab('report')}
                                className={`
                  flex-1 px-6 py-4 font-medium transition-all flex items-center justify-center gap-2
                  ${activeTab === 'report'
                                        ? 'text-medical-accent-blue border-b-2 border-medical-accent-blue bg-medical-bg-tertiary/50'
                                        : 'text-medical-text-secondary hover:text-medical-text-primary hover:bg-medical-bg-tertiary/30'
                                    }
                `}
                            >
                                <FileText className="w-5 h-5" />
                                Report
                            </button>
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`
                  flex-1 px-6 py-4 font-medium transition-all flex items-center justify-center gap-2
                  ${activeTab === 'chat'
                                        ? 'text-medical-accent-blue border-b-2 border-medical-accent-blue bg-medical-bg-tertiary/50'
                                        : 'text-medical-text-secondary hover:text-medical-text-primary hover:bg-medical-bg-tertiary/30'
                                    }
                `}
                            >
                                <MessageSquare className="w-5 h-5" />
                                Assistant
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-hidden">
                            {isAnalyzing ? (
                                <LoadingStates currentStage={currentStage} />
                            ) : activeTab === 'report' ? (
                                <ReportTab analysisResult={analysisResult} />
                            ) : (
                                <ChatTab analysisResult={analysisResult} />
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-medical-border bg-medical-bg-secondary/50 py-4">
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between text-sm text-medical-text-muted">
                        <p>
                            Powered by TorchXRayVision • FAISS • Medical LLM
                        </p>
                        <p>
                            For research and educational purposes only
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;

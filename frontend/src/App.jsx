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
    const [chatHistory, setChatHistory] = useState([
        {
            role: 'assistant',
            content: 'Hello! I\'m your AI medical assistant. I can help answer questions about the current X-ray analysis. What would you like to know?'
        }
    ]);

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
        <div className="h-screen bg-medical-bg-primary flex flex-col overflow-hidden">
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

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-6 space-y-6">
                    {/* Two Column Grid */}
                    <div className="grid grid-cols-2 gap-6" style={{ minHeight: '700px' }}>
                        {/* Left Panel - Image Viewer */}
                        <div className="h-full">
                            <ImageViewer
                                onImageSelect={handleImageSelect}
                                currentImage={currentImage}
                            />
                        </div>

                        {/* Right Panel - Tabbed Interface */}
                        <div className="h-full flex flex-col glass-card overflow-hidden">
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
                                    <ChatTab
                                        analysisResult={analysisResult}
                                        chatHistory={chatHistory}
                                        setChatHistory={setChatHistory}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Similar Historical Cases - Full Width Section */}
                    {analysisResult?.similar_cases && analysisResult.similar_cases.length > 0 && (
                        <div className="glass-card p-6 flex-shrink-0">
                            <h3 className="text-xl font-semibold mb-4 text-medical-text-primary flex items-center gap-2">
                                <FileText className="w-6 h-6" />
                                Similar Historical Cases
                                <span className="text-sm font-normal text-medical-text-muted ml-2">
                                    ({analysisResult.similar_cases.length} cases found)
                                </span>
                            </h3>
                            <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {analysisResult.similar_cases.map((caseItem, idx) => (
                                    <details key={idx} className="bg-medical-bg-tertiary rounded-lg border border-medical-border hover:border-medical-accent-blue/50 transition-colors">
                                        <summary className="cursor-pointer p-4 font-medium text-medical-text-primary hover:text-medical-accent-blue transition-colors flex items-center justify-between list-none">
                                            <span className="flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-full bg-medical-accent-blue/20 flex items-center justify-center text-sm">
                                                    {caseItem.rank}
                                                </span>
                                                Case #{caseItem.rank}
                                            </span>
                                            <span className="text-sm text-medical-text-muted">
                                                {(caseItem.similarity * 100).toFixed(0)}% match
                                            </span>
                                        </summary>
                                        <div className="px-4 pb-4 pt-2 text-sm text-medical-text-secondary max-h-[300px] overflow-y-auto custom-scrollbar">
                                            <div className="prose prose-sm prose-invert max-w-none break-words">
                                                {caseItem.report}
                                            </div>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

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

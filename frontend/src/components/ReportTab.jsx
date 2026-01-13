import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FileDown, Copy, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import jsPDF from 'jspdf';

const getSeverityClass = (confidence) => {
    if (confidence >= 0.7) return 'badge-critical';
    if (confidence >= 0.4) return 'badge-moderate';
    return 'badge-normal';
};

export default function ReportTab({ analysisResult }) {
    const [showSimilarCases, setShowSimilarCases] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    if (!analysisResult) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-medical-text-secondary">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No report generated yet</p>
                    <p className="text-sm mt-2">Upload an X-ray to begin analysis</p>
                </div>
            </div>
        );
    }

    const handleExportPDF = () => {
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        let y = 20;

        // Title
        pdf.setFontSize(18);
        pdf.setFont(undefined, 'bold');
        pdf.text('Radiology Report', margin, y);
        y += 15;

        // Date
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
        y += 15;

        // Findings
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Detected Pathologies:', margin, y);
        y += 10;

        pdf.setFontSize(11);
        pdf.setFont(undefined, 'normal');
        analysisResult.findings.forEach((finding) => {
            const text = `• ${finding.name} (${(finding.confidence * 100).toFixed(1)}%)`;
            pdf.text(text, margin + 5, y);
            y += 7;
        });
        y += 10;

        // Report
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Report:', margin, y);
        y += 10;

        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const reportLines = pdf.splitTextToSize(
            analysisResult.generated_report,
            pageWidth - 2 * margin
        );
        reportLines.forEach((line) => {
            if (y > 270) {
                pdf.addPage();
                y = 20;
            }
            pdf.text(line, margin, y);
            y += 6;
        });

        pdf.save('radiology-report.pdf');
    };

    const handleCopyReport = () => {
        const fullReport = `RADIOLOGY REPORT\n\nDetected Pathologies:\n${analysisResult.findings
            .map((f) => `• ${f.name} (${(f.confidence * 100).toFixed(1)}%)`)
            .join('\n')}\n\nReport:\n${analysisResult.generated_report}`;

        navigator.clipboard.writeText(fullReport);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header with Actions */}
            <div className="flex items-center justify-between p-4 border-b border-medical-border bg-medical-bg-tertiary/30">
                <h2 className="text-lg font-semibold text-medical-text-primary">
                    Medical Report
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopyReport}
                        className="btn-secondary text-sm flex items-center gap-2"
                    >
                        <Copy className="w-4 h-4" />
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="btn-primary text-sm flex items-center gap-2"
                    >
                        <FileDown className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Report Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* Detected Pathologies */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4 text-medical-text-primary">
                        Detected Pathologies
                    </h3>
                    {analysisResult.findings.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {analysisResult.findings.map((finding, idx) => (
                                <span
                                    key={idx}
                                    className={`badge ${getSeverityClass(finding.confidence)}`}
                                >
                                    {finding.name}
                                    <span className="ml-2 opacity-80">
                                        {(finding.confidence * 100).toFixed(0)}%
                                    </span>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-medical-text-secondary">
                            No significant pathologies detected
                        </p>
                    )}
                </div>

                {/* Generated Report */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4 text-medical-text-primary">
                        AI-Generated Analysis
                    </h3>
                    <div className="prose prose-invert prose-medical max-w-none">
                        <ReactMarkdown
                            components={{
                                h1: ({ node, ...props }) => (
                                    <h1 className="text-2xl font-bold mb-4 text-medical-text-primary" {...props} />
                                ),
                                h2: ({ node, ...props }) => (
                                    <h2 className="text-xl font-semibold mb-3 mt-6 text-medical-text-primary" {...props} />
                                ),
                                h3: ({ node, ...props }) => (
                                    <h3 className="text-lg font-semibold mb-2 mt-4 text-medical-text-primary" {...props} />
                                ),
                                p: ({ node, ...props }) => (
                                    <p className="mb-3 text-medical-text-primary leading-relaxed" {...props} />
                                ),
                                ul: ({ node, ...props }) => (
                                    <ul className="list-disc list-inside mb-3 space-y-1 text-medical-text-primary" {...props} />
                                ),
                                li: ({ node, ...props }) => (
                                    <li className="text-medical-text-primary" {...props} />
                                ),
                                strong: ({ node, ...props }) => (
                                    <strong className="font-semibold text-medical-accent-blue" {...props} />
                                ),
                            }}
                        >
                            {analysisResult.generated_report}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* Similar Cases */}
                {analysisResult.similar_cases && analysisResult.similar_cases.length > 0 && (
                    <div className="glass-card overflow-hidden">
                        <button
                            onClick={() => setShowSimilarCases(!showSimilarCases)}
                            className="w-full p-4 flex items-center justify-between hover:bg-medical-bg-tertiary/30 transition-colors"
                        >
                            <h3 className="text-lg font-semibold text-medical-text-primary">
                                Similar Historical Cases ({analysisResult.similar_cases.length})
                            </h3>
                            {showSimilarCases ? (
                                <ChevronUp className="w-5 h-5 text-medical-text-secondary" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-medical-text-secondary" />
                            )}
                        </button>

                        {showSimilarCases && (
                            <div className="p-4 pt-0 space-y-3 border-t border-medical-border">
                                {analysisResult.similar_cases.map((case_item, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 bg-medical-bg-tertiary rounded-lg border border-medical-border"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-medical-accent-blue">
                                                Case #{case_item.rank}
                                            </span>
                                            <span className="text-xs text-medical-text-muted">
                                                Similarity: {(case_item.similarity * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <p className="text-sm text-medical-text-secondary whitespace-pre-wrap">
                                            {case_item.report}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Metadata */}
                <div className="text-sm text-medical-text-muted text-center pb-4">
                    Analysis completed in {analysisResult.processing_time?.toFixed(2)}s
                </div>
            </div>
        </div>
    );
}

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { sendChatMessage } from '../services/api';

export default function ChatTab({ analysisResult }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hello! I\'m your AI medical assistant. I can help answer questions about the current X-ray analysis. What would you like to know?'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message
        const newMessages = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Build case context
            let caseContext = '';
            if (analysisResult?.findings) {
                const findingsStr = analysisResult.findings
                    .map(f => `${f.name} (${(f.confidence * 100).toFixed(0)}%)`)
                    .join(', ');
                caseContext = `Current case findings: ${findingsStr}\n\n`;
            }
            if (analysisResult?.generated_report) {
                caseContext += `Report:\n${analysisResult.generated_report.substring(0, 500)}...`;
            }

            // Send to backend
            const response = await sendChatMessage(
                newMessages.map(m => ({ role: m.role, content: m.content })),
                userMessage,
                caseContext
            );

            if (response.success) {
                setMessages([
                    ...newMessages,
                    { role: 'assistant', content: response.response }
                ]);
            } else {
                setMessages([
                    ...newMessages,
                    {
                        role: 'assistant',
                        content: '⚠️ Sorry, I encountered an error. Please try again.'
                    }
                ]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages([
                ...newMessages,
                {
                    role: 'assistant',
                    content: '⚠️ Unable to connect to the server. Please check your connection.'
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const suggestedQuestions = [
        'What does this finding mean?',
        'What are the next steps?',
        'Is this condition serious?',
        'What causes this pathology?'
    ];

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-medical-border bg-medical-bg-tertiary/30">
                <h2 className="text-lg font-semibold text-medical-text-primary flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Medical Assistant Chat
                </h2>
                {analysisResult && (
                    <p className="text-sm text-medical-text-secondary mt-1">
                        Ask questions about the current case
                    </p>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {messages.map((message, idx) => (
                    <div
                        key={idx}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={message.role === 'user' ? 'message-user' : 'message-assistant'}>
                            {message.role === 'assistant' ? (
                                <ReactMarkdown
                                    components={{
                                        p: ({ node, ...props }) => (
                                            <p className="mb-2 last:mb-0" {...props} />
                                        ),
                                        strong: ({ node, ...props }) => (
                                            <strong className="font-semibold text-medical-accent-blue" {...props} />
                                        ),
                                        ul: ({ node, ...props }) => (
                                            <ul className="list-disc list-inside mb-2 space-y-1" {...props} />
                                        ),
                                    }}
                                >
                                    {message.content}
                                </ReactMarkdown>
                            ) : (
                                <p className="whitespace-pre-wrap">{message.content}</p>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="message-assistant flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions (only show if no messages yet) */}
            {messages.length === 1 && analysisResult && (
                <div className="px-6 pb-4">
                    <p className="text-sm text-medical-text-muted mb-2">Suggested questions:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.map((question, idx) => (
                            <button
                                key={idx}
                                onClick={() => setInput(question)}
                                className="text-sm px-3 py-1.5 rounded-full bg-medical-bg-tertiary border border-medical-border hover:border-medical-accent-blue transition-colors text-medical-text-secondary hover:text-medical-text-primary"
                            >
                                {question}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-medical-border bg-medical-bg-tertiary/30">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                            analysisResult
                                ? 'Ask a question about the report...'
                                : 'Upload an X-ray first to start chatting'
                        }
                        disabled={!analysisResult || isLoading}
                        className="input-field flex-1"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || !analysisResult || isLoading}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

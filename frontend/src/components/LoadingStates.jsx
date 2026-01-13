import React from 'react';
import { Activity, Database, Brain } from 'lucide-react';

const stages = [
    {
        id: 1,
        icon: Activity,
        title: 'Analyzing X-ray structure',
        description: 'Detecting pathologies with computer vision',
        color: 'text-medical-accent-blue'
    },
    {
        id: 2,
        icon: Database,
        title: 'Retrieving similar cases',
        description: 'Searching medical database',
        color: 'text-medical-accent-purple'
    },
    {
        id: 3,
        icon: Brain,
        title: 'Generating professional report',
        description: 'AI-powered medical analysis',
        color: 'text-medical-accent-green'
    }
];

export default function LoadingStates({ currentStage = 1 }) {
    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="max-w-2xl w-full px-8">
                <div className="text-center mb-12">
                    <div className="w-20 h-20 mx-auto mb-6 relative">
                        <div className="absolute inset-0 bg-medical-accent-blue/20 rounded-full animate-ping"></div>
                        <div className="relative w-20 h-20 bg-medical-accent-blue/30 rounded-full flex items-center justify-center">
                            <Activity className="w-10 h-10 text-medical-accent-blue animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-medical-text-primary mb-2">
                        Processing Medical Image
                    </h2>
                    <p className="text-medical-text-secondary">
                        Please wait while our AI analyzes the X-ray...
                    </p>
                </div>

                {/* Progress Stages */}
                <div className="space-y-4">
                    {stages.map((stage) => {
                        const Icon = stage.icon;
                        const isActive = stage.id === currentStage;
                        const isComplete = stage.id < currentStage;

                        return (
                            <div
                                key={stage.id}
                                className={`
                  flex items-center gap-4 p-4 rounded-lg
                  transition-all duration-300
                  ${isActive
                                        ? 'bg-medical-bg-tertiary border border-medical-accent-blue/50 scale-105'
                                        : isComplete
                                            ? 'bg-medical-bg-tertiary/50 border border-medical-accent-green/30'
                                            : 'bg-medical-bg-secondary border border-medical-border opacity-50'
                                    }
                `}
                            >
                                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  ${isActive
                                        ? 'bg-medical-accent-blue/20 animate-pulse'
                                        : isComplete
                                            ? 'bg-medical-accent-green/20'
                                            : 'bg-medical-bg-primary'
                                    }
                `}>
                                    <Icon className={`w-6 h-6 ${isActive
                                            ? 'text-medical-accent-blue'
                                            : isComplete
                                                ? 'text-medical-accent-green'
                                                : 'text-medical-text-muted'
                                        }`} />
                                </div>

                                <div className="flex-1">
                                    <h3 className={`font-semibold ${isActive || isComplete
                                            ? 'text-medical-text-primary'
                                            : 'text-medical-text-muted'
                                        }`}>
                                        {stage.title}
                                    </h3>
                                    <p className="text-sm text-medical-text-secondary">
                                        {stage.description}
                                    </p>
                                </div>

                                {isActive && (
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-medical-accent-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-medical-accent-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-medical-accent-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                )}

                                {isComplete && (
                                    <div className="w-6 h-6 rounded-full bg-medical-accent-green/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-medical-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Progress Bar */}
                <div className="mt-8">
                    <div className="w-full h-2 bg-medical-bg-tertiary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-medical-accent-blue to-medical-accent-green transition-all duration-500"
                            style={{ width: `${(currentStage / stages.length) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-center mt-2 text-sm text-medical-text-muted">
                        Step {currentStage} of {stages.length}
                    </p>
                </div>
            </div>
        </div>
    );
}

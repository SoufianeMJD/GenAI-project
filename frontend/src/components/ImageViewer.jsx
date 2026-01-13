import React, { useState, useRef } from 'react';
import { Upload, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export default function ImageViewer({ onImageSelect, currentImage }) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileSelect = (file) => {
        if (file && file.type.startsWith('image/')) {
            onImageSelect(file);
        } else {
            alert('Please select a valid image file (JPEG, PNG)');
        }
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Upload Area */}
            {!currentImage ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
            flex-1 flex flex-col items-center justify-center
            glass-card cursor-pointer
            transition-all duration-300
            ${isDragging
                            ? 'border-medical-accent-blue bg-medical-accent-blue/10 scale-[0.98]'
                            : 'border-dashed hover:border-medical-accent-blue hover:bg-medical-bg-tertiary/50'
                        }
          `}
                >
                    <Upload
                        className={`w-20 h-20 mb-6 transition-colors ${isDragging ? 'text-medical-accent-blue' : 'text-medical-text-secondary'
                            }`}
                    />
                    <h3 className="text-2xl font-semibold mb-2 text-medical-text-primary">
                        Upload Chest X-Ray
                    </h3>
                    <p className="text-medical-text-secondary mb-4 text-center max-w-md">
                        Drag and drop an X-ray image here, or click to browse
                    </p>
                    <p className="text-sm text-medical-text-muted">
                        Supported formats: JPEG, PNG (max 10MB)
                    </p>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                    />
                </div>
            ) : (
                /* Image Display with Controls */
                <div className="flex-1 flex flex-col glass-card overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between p-4 border-b border-medical-border bg-medical-bg-tertiary/50">
                        <h3 className="font-semibold text-medical-text-primary">
                            X-Ray Image
                        </h3>
                        <button
                            onClick={() => onImageSelect(null)}
                            className="btn-secondary text-sm"
                        >
                            Upload New
                        </button>
                    </div>

                    {/* Image Viewer with Zoom Controls */}
                    <TransformWrapper
                        initialScale={1}
                        minScale={0.5}
                        maxScale={5}
                        wheel={{ step: 0.1 }}
                        doubleClick={{ mode: 'reset' }}
                    >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                            <>
                                {/* Controls */}
                                <div className="absolute top-20 right-6 z-10 flex flex-col gap-2">
                                    <button
                                        onClick={() => zoomIn()}
                                        className="btn-icon bg-medical-bg-tertiary shadow-lg"
                                        title="Zoom In"
                                    >
                                        <ZoomIn className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => zoomOut()}
                                        className="btn-icon bg-medical-bg-tertiary shadow-lg"
                                        title="Zoom Out"
                                    >
                                        <ZoomOut className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => resetTransform()}
                                        className="btn-icon bg-medical-bg-tertiary shadow-lg"
                                        title="Reset View"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Image */}
                                <TransformComponent
                                    wrapperClass="flex-1 w-full h-full"
                                    contentClass="w-full h-full flex items-center justify-center"
                                >
                                    <img
                                        src={URL.createObjectURL(currentImage)}
                                        alt="X-Ray"
                                        className="max-w-full max-h-full object-contain"
                                        style={{ imageRendering: 'crisp-edges' }}
                                    />
                                </TransformComponent>
                            </>
                        )}
                    </TransformWrapper>
                </div>
            )}
        </div>
    );
}

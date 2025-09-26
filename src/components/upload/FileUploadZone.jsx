import React, { useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FileUploadZone({ onFileSelect }) {
    const [dragActive, setDragActive] = React.useState(false);
    const inputRef = useRef(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files);
        }
    }, [onFileSelect]);
    
    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files);
        }
    };

    const onButtonClick = () => {
        inputRef.current.click();
    };

    return (
        <form
            id="form-file-upload"
            onDragEnter={handleDrag}
            onSubmit={(e) => e.preventDefault()}
            className={`
                relative w-full h-64 border-2 border-dashed rounded-xl transition-all duration-300
                flex flex-col items-center justify-center
                ${dragActive ? "border-blue-600 bg-blue-50" : "border-slate-300 bg-slate-50"}
            `}
        >
            <input
                ref={inputRef}
                type="file"
                id="input-file-upload"
                multiple={true}
                onChange={handleChange}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.tiff"
            />
            <label
                id="label-file-upload"
                htmlFor="input-file-upload"
                className={`h-full w-full flex flex-col items-center justify-center text-center cursor-pointer ${dragActive ? "pointer-events-none" : ""}`}
            >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
                    <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <p className="font-semibold text-slate-700">גרור קבצים לכאן או לחץ לבחירה</p>
                <p className="text-sm text-slate-500 mt-1">PDF, JPG, PNG, TIFF (עד 50MB)</p>
                <Button type="button" onClick={onButtonClick} variant="outline" className="mt-4">
                    בחר קבצים
                </Button>
            </label>
            {dragActive && (
                <div
                    className="absolute inset-0 w-full h-full rounded-xl"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                ></div>
            )}
        </form>
    );
}
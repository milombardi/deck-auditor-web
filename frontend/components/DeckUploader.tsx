"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X } from "lucide-react";

type Props = {
  file: File | null;
  onFile: (f: File | null) => void;
};

export default function DeckUploader({ file, onFile }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
    },
  });

  if (file) {
    return (
      <div className="card p-5 flex items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-accent-blue/10 text-accent-blue flex items-center justify-center">
          <FileText size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-ink-high font-medium truncate">{file.name}</div>
          <div className="text-ink-low text-xs">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>
        <button
          onClick={() => onFile(null)}
          className="text-ink-low hover:text-ink-high p-1"
          aria-label="Remove file"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`card border-dashed border-2 ${
        isDragActive ? "border-accent-blue bg-accent-blue/5" : "border-border"
      } cursor-pointer transition px-6 py-10 flex flex-col items-center text-center gap-3 hover:border-borderStrong`}
    >
      <input {...getInputProps()} />
      <div className="w-14 h-14 rounded-xl bg-surfaceAlt flex items-center justify-center text-ink-mid">
        <Upload size={26} />
      </div>
      <div>
        <div className="text-ink-high font-semibold">Upload a .pptx file</div>
        <div className="text-ink-low text-sm">
          Drag & drop or click to browse
        </div>
      </div>
      <div className="text-ink-muted text-xs">200MB per file · PPTX</div>
    </div>
  );
}

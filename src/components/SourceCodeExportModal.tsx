import React, { useState } from 'react';
import { 
  Download, 
  Code, 
  FileCode, 
  Copy, 
  Check, 
  X, 
  FolderDown, 
  Cpu, 
  Terminal, 
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import { getAllProjectFiles, downloadSelfExtractingInstaller, SourceFileItem } from '../utils/sourceFilesArchive';
import { downloadFile, exportESP32ArduinoCode } from '../utils/downloadHelper';

interface SourceCodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SourceCodeExportModal: React.FC<SourceCodeExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [files] = useState<SourceFileItem[]>(() => getAllProjectFiles());
  const [selectedFile, setSelectedFile] = useState<SourceFileItem>(() => files[0]);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadSingle = (file: SourceFileItem) => {
    const ext = file.name.split('.').pop() || 'txt';
    let mime = 'text/plain';
    if (ext === 'json') mime = 'application/json';
    if (ext === 'ts' || ext === 'tsx') mime = 'text/typescript';
    if (ext === 'ino') mime = 'text/x-csrc';
    if (ext === 'html') mime = 'text/html';

    downloadFile(file.name, file.content, mime);
    setDownloadSuccess(file.name);
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  const handleDownloadAll = () => {
    downloadSelfExtractingInstaller();
    setDownloadSuccess('setup-roadguard.js');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div 
      id="source-export-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="source-export-modal"
        className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden transition-all transform animate-in slide-in-from-bottom duration-300 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60 shadow-xs">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Direct Code Downloader</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Free Tier Ready
                </span>
              </h3>
              <p className="text-xs text-slate-500">Download complete project files or copy raw code</p>
            </div>
          </div>
          <button 
            id="close-source-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1-Click Fast Extractor Card */}
        <div className="p-4 bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-slate-50 border-b border-slate-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Terminal className="w-4 h-4 text-emerald-700" />
              <span>1-Click Auto-Extractor Script</span>
            </div>
            <p className="text-xs text-slate-600 max-w-md">
              Downloads <code className="bg-white/80 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px]">setup-roadguard.js</code>. Run <code className="font-mono text-emerald-800 font-bold">node setup-roadguard.js</code> in any folder to unpack all code!
            </p>
          </div>

          <button
            id="download-auto-extractor-btn"
            onClick={handleDownloadAll}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download All Files (.JS)</span>
          </button>
        </div>

        {downloadSuccess && (
          <div className="px-4 py-2 bg-emerald-100/80 text-emerald-900 text-xs font-semibold flex items-center gap-2 border-b border-emerald-200 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Downloaded <strong>{downloadSuccess}</strong> directly to your computer!</span>
          </div>
        )}

        {/* Split File Browser & Code Viewer */}
        <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
          {/* File List Column */}
          <div className="w-full sm:w-56 border-b sm:border-b-0 sm:border-r border-slate-200/80 bg-slate-50/50 p-2 overflow-y-auto space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 block">
              Project Files ({files.length})
            </span>

            {files.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  id={`file-item-${file.name}`}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between group transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {file.category === 'Firmware' ? (
                      <Cpu className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-teal-300' : 'text-emerald-600'}`} />
                    ) : (
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-teal-300' : 'text-slate-400'}`} />
                    )}
                    <span className="truncate">{file.name}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active File Content Viewer */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900 text-slate-100">
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <span className="font-mono text-xs text-teal-400 font-bold truncate">
                  {selectedFile.path}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                  {selectedFile.content.split('\n').length} lines
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  id="copy-active-file-btn"
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1 transition-all active:scale-95 border border-slate-700"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  id="download-active-file-btn"
                  onClick={() => handleDownloadSingle(selectedFile)}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-all active:scale-95 shadow-xs"
                  title="Download this file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="flex-1 p-3 overflow-auto font-mono text-[11px] leading-relaxed text-slate-300 bg-slate-900 selection:bg-teal-700 selection:text-white">
              <pre>
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Ready to edit locally in VSCode, Cursor, or Arduino IDE</span>
          <button
            id="close-source-export-bottom-btn"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-all text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

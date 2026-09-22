import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MemoryStick as Memory,
  Calendar,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Code2,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import toast from "react-hot-toast";

const SubmissionsList = ({ submissions = [], isLoading, onSelectCode }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const safeParse = (data) => {
    if (!data) return [];
    try {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const calculateAverageMemory = (memoryData) => {
    const list = safeParse(memoryData);
    const memoryArray = list
      .filter((m) => m != null && typeof m === "string")
      .map((m) => parseFloat(m.split(" ")[0]))
      .filter((n) => !isNaN(n));
    if (memoryArray.length === 0) return 0;
    return (
      memoryArray.reduce((acc, curr) => acc + curr, 0) / memoryArray.length
    );
  };

  const calculateAverageTime = (timeData) => {
    const list = safeParse(timeData);
    const timeArray = list
      .filter((t) => t != null && typeof t === "string")
      .map((t) => parseFloat(t.split(" ")[0]))
      .filter((n) => !isNaN(n));
    if (timeArray.length === 0) return 0;
    return timeArray.reduce((acc, curr) => acc + curr, 0) / timeArray.length;
  };

  const handleCopyCode = (e, id, codeText) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeText);
    setCopiedId(id);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLoadCode = (e, codeText) => {
    e.stopPropagation();
    if (onSelectCode) {
      onSelectCode(codeText);
      toast.success("Loaded solution into code editor!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-2">
        <span className="loading loading-spinner loading-md text-emerald-500"></span>
        <span className="text-xs">Fetching submissions...</span>
      </div>
    );
  }

  if (!submissions?.length) {
    return (
      <div className="text-center py-12 px-4 bg-[#242424] rounded-lg border border-[#333]">
        <Code2 className="w-8 h-8 text-gray-500 mx-auto mb-2" />
        <div className="text-gray-300 font-medium text-sm">No submissions yet</div>
        <div className="text-gray-500 text-xs mt-1">Submit your code to see your performance history here.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((submission) => {
        const isAccepted = submission.status === "Accepted";
        const isExpanded = expandedId === submission.id;
        const avgMemory = calculateAverageMemory(submission.memory);
        const avgTime = calculateAverageTime(submission.time);
        const rawCode = typeof submission.sourceCode === "string" 
          ? submission.sourceCode 
          : JSON.stringify(submission.sourceCode, null, 2);

        return (
          <div
            key={submission.id}
            className={`bg-[#242424] border transition-all rounded-lg overflow-hidden ${
              isExpanded ? "border-emerald-500/50 shadow-lg" : "border-[#333] hover:border-gray-600"
            }`}
          >
            {/* Header / Clickable Summary Row */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : submission.id)}
              className="p-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-[#282828] transition-colors"
            >
              <div className="flex items-center gap-3">
                {isAccepted ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accepted</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs">
                    <XCircle className="w-4 h-4" />
                    <span>{submission.status || "Failed"}</span>
                  </div>
                )}

                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1a1a1a] text-gray-300 border border-[#3a3a3a]">
                  {submission.language}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                {avgTime > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>{avgTime.toFixed(3)} s</span>
                  </div>
                )}

                {avgMemory > 0 && (
                  <div className="flex items-center gap-1">
                    <Memory className="w-3.5 h-3.5 text-gray-500" />
                    <span>{avgMemory.toFixed(0)} KB</span>
                  </div>
                )}

                <div className="flex items-center gap-1 font-sans text-gray-500 text-[11px]">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="text-gray-500 hover:text-gray-300">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Expanded Submission Details */}
            {isExpanded && (
              <div className="border-t border-[#333] p-4 bg-[#1a1a1a] space-y-4 text-xs font-mono">
                {/* Actions Toolbar */}
                <div className="flex items-center justify-between font-sans">
                  <span className="text-gray-400 font-semibold text-xs uppercase tracking-wider">
                    Submitted Code ({submission.language})
                  </span>

                  <div className="flex items-center gap-2">
                    {onSelectCode && (
                      <button
                        onClick={(e) => handleLoadCode(e, rawCode)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#2a2a2a] hover:bg-[#333] text-gray-200 rounded border border-[#444] transition-colors"
                        title="Load this code into the editor"
                      >
                        <RotateCcw className="w-3 h-3 text-emerald-400" />
                        <span>Load in Editor</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => handleCopyCode(e, submission.id, rawCode)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#2a2a2a] hover:bg-[#333] text-gray-200 rounded border border-[#444] transition-colors"
                      title="Copy Code"
                    >
                      {copiedId === submission.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-gray-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Source Code Block */}
                <pre className="p-3 bg-[#111] rounded border border-[#2d2d2d] text-gray-200 overflow-x-auto whitespace-pre leading-relaxed custom-scrollbar max-h-64 font-mono text-xs">
                  {rawCode}
                </pre>

                {/* Compiler / Error Output if present */}
                {submission.compileOutput && (
                  <div className="p-3 bg-[#241a1a] border border-amber-900/40 rounded text-amber-300 font-mono text-xs whitespace-pre-wrap">
                    <div className="font-bold mb-1 text-amber-400 font-sans flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Compiler Details:
                    </div>
                    {submission.compileOutput}
                  </div>
                )}

                {/* Testcases Overview */}
                {submission.testCases && submission.testCases.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#2d2d2d]">
                    <div className="font-sans font-semibold text-gray-400 text-xs">
                      Test Cases ({submission.testCases.filter(t => t.passed).length}/{submission.testCases.length} Passed)
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {submission.testCases.map((tc, idx) => (
                        <div
                          key={tc.id || idx}
                          className={`p-2 rounded border font-mono text-xs flex items-center justify-between ${
                            tc.passed
                              ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300"
                              : "bg-rose-950/20 border-rose-900/40 text-rose-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {tc.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            )}
                            <span>Case {tc.testCase || idx + 1}</span>
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {tc.time || tc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SubmissionsList;

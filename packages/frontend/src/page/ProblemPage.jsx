import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import {
  Play,
  Send,
  FileText,
  MessageSquare,
  Lightbulb,
  Bookmark,
  Share2,
  Clock,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Terminal,
  Code2,
  Users,
  ThumbsUp,
  Home,
  RotateCcw,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Info,
  Maximize2
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useProblemStore } from "../store/useProblemStore";
import { getLanguageId, getMonacoLanguage } from "../lib/lang";
import { useExecutionStore } from "../store/useExecutionStore";
import { useSubmissionStore } from "../store/useSubmissionStore";
import { useAuthStore } from "../store/useAuthStore";
import AddToPlaylistModal from "../components/AddToPlaylist";
import SubmissionsList from "../components/SubmissionList";
import toast from "react-hot-toast";

const ProblemPage = () => {
  const { id } = useParams();
  const { getProblemById, problem, isProblemLoading } = useProblemStore();
  const { authUser } = useAuthStore();

  const {
    submissions,
    submission: submissionList,
    isLoading: isSubmissionsLoading,
    getSubmissionForProblem,
    getSubmissionCountForProblem,
    submissionCount,
  } = useSubmissionStore();

  const {
    runCode,
    submitCode,
    isExecuting,
    isSubmitting,
    runResult,
    submission,
  } = useExecutionStore();

  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [selectedLanguage, setSelectedLanguage] = useState("CPP");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState(15);
  const [copied, setCopied] = useState(false);

  // Bottom Console States
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleTab, setConsoleTab] = useState("testcase"); // 'testcase' | 'result'
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [customTestcases, setCustomTestcases] = useState([]);
  const [activeResultCaseIndex, setActiveResultCaseIndex] = useState(0);

  useEffect(() => {
    if (id) {
      getProblemById(id);
      getSubmissionCountForProblem(id);
      getSubmissionForProblem(id);
    }
  }, [id]);

  useEffect(() => {
    if (problem) {
      const snippets = problem.codeSnippets || {};
      const langKeys = Object.keys(snippets);
      
      let defaultLang = "CPP";
      if (!snippets.CPP && !snippets.cpp) {
        if (snippets.JAVA || snippets.java) defaultLang = "JAVA";
        else if (snippets.PYTHON || snippets.python) defaultLang = "PYTHON";
        else if (snippets.JAVASCRIPT || snippets.javascript) defaultLang = "JAVASCRIPT";
        else if (langKeys.length > 0) defaultLang = langKeys[0].toUpperCase();
      }

      setSelectedLanguage((prev) => {
        const currentSnippet = snippets[prev] || snippets[prev.toLowerCase()];
        return currentSnippet ? prev : defaultLang;
      });

      const initialCases = (problem.testcases || []).map((tc, idx) => ({
        id: idx + 1,
        input: tc.input || "",
        output: tc.output || "",
      }));
      setCustomTestcases(initialCases);
    }
  }, [problem]);

  useEffect(() => {
    if (problem?.codeSnippets) {
      const snippet =
        problem.codeSnippets[selectedLanguage] ||
        problem.codeSnippets[selectedLanguage.toLowerCase()] ||
        getDefaultSnippet(problem.title, selectedLanguage);
      setCode(snippet);
    }
  }, [problem, selectedLanguage]);

  useEffect(() => {
    if (activeTab === "submissions" && id) {
      getSubmissionForProblem(id);
    }
  }, [activeTab, id]);

  const getDefaultSnippet = (title = "", lang = "CPP") => {
    const cleanLang = lang.toUpperCase();
    let func = "climbStairs(int n)";
    let returnType = "int";
    let defaultReturn = "0";

    if (title.toLowerCase().includes("two sum")) {
      func = "twoSum(vector<int>& nums, int target)";
      returnType = "vector<int>";
      defaultReturn = "{}";
    } else if (title.toLowerCase().includes("add two")) {
      func = "addTwoNumbers(int a, int b)";
    }

    if (cleanLang === "CPP" || cleanLang === "C++") {
      return `class Solution {\npublic:\n    ${returnType} ${func} {\n        // Write your solution here\n        return ${defaultReturn};\n    }\n};`;
    }
    if (cleanLang === "JAVA") {
      return `class Solution {\n    public ${returnType === 'vector<int>' ? 'int[]' : 'int'} ${func.replace('vector<int>&', 'int[]')} {\n        // Write your solution here\n        return ${defaultReturn === '{}' ? 'new int[]{}' : '0'};\n    }\n}`;
    }
    if (cleanLang === "PYTHON") {
      const pFunc = func.split("(")[0];
      return `class Solution:\n    def ${pFunc}(self, n: int) -> int:\n        # Write your solution here\n        return 0`;
    }
    if (cleanLang === "JAVASCRIPT" || cleanLang === "JS") {
      const jFunc = func.split("(")[0];
      return `/**\n * @param {number} n\n * @return {number}\n */\nvar ${jFunc} = function(n) {\n    // Write your solution here\n};`;
    }
    return "";
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
  };

  const handleResetCode = () => {
    if (window.confirm("Reset editor to default starter template? Current changes will be lost.")) {
      const snippet =
        problem?.codeSnippets?.[selectedLanguage] ||
        problem?.codeSnippets?.[selectedLanguage.toLowerCase()] ||
        getDefaultSnippet(problem?.title, selectedLanguage);
      setCode(snippet);
      toast.success("Code reset to template");
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCode = async (e) => {
    e?.preventDefault();
    if (!problem) return;
    try {
      setIsConsoleOpen(true);
      setConsoleTab("result");

      const language_id = getLanguageId(selectedLanguage);
      const stdin = customTestcases.map((tc) => tc.input);
      const expected_outputs = customTestcases.map((tc) => tc.output);

      await runCode(code, language_id, stdin, expected_outputs, id);
    } catch (error) {
      console.error("Error executing code", error);
    }
  };

  const handleSubmitCode = async (e) => {
    e?.preventDefault();
    if (!problem) return;
    try {
      setIsConsoleOpen(true);
      setConsoleTab("result");

      const language_id = getLanguageId(selectedLanguage);
      const stdin = (problem.testcases || []).map((tc) => tc.input);
      const expected_outputs = (problem.testcases || []).map((tc) => tc.output);

      const res = await submitCode(code, language_id, stdin, expected_outputs, id);
      if (res) {
        await getSubmissionForProblem(id);
        await getSubmissionCountForProblem(id);
        await getProblemById(id);
      }
    } catch (error) {
      console.error("Error submitting code", error);
    }
  };

  const handleCustomInputChange = (value, index) => {
    setCustomTestcases((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], input: value };
      return copy;
    });
  };

  const handleAddCustomCase = () => {
    setCustomTestcases((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        input: "",
        output: "",
      },
    ]);
    setActiveCaseIndex(customTestcases.length);
  };

  const isProblemSolved = problem?.solvedBy?.some(
    (user) => user.userId === authUser?.id
  );

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case "EASY":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "MEDIUM":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "HARD":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    }
  };

  if (isProblemLoading || !problem) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121212]">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <span className="loading loading-spinner loading-lg text-emerald-500"></span>
          <p className="text-sm font-medium">Loading problem workspace...</p>
        </div>
      </div>
    );
  }

  const currentResult = runResult
    ? {
        overallStatus: runResult.overallStatus,
        results: runResult.results || [],
        allPassed: runResult.allPassed,
      }
    : submission
    ? {
        overallStatus: submission.status,
        results: (submission.testCases || []).map((tc, idx) => ({
          testCase: tc.testCase || idx + 1,
          passed: tc.passed,
          stdout: tc.stdout,
          expected: tc.expected,
          stdin: tc.stdin || (problem?.testcases?.[idx]?.input ?? ""),
          stderr: tc.stderr || null,
          compile_output: tc.compileOutput || tc.compile_output || null,
          status: tc.status || submission.status,
          memory: tc.memory,
          time: tc.time,
        })),
        allPassed: submission.status === "Accepted",
      }
    : null;

  const activeResultCase = currentResult?.results?.[activeResultCaseIndex] || currentResult?.results?.[0];

  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a] text-gray-200 overflow-hidden font-sans">
      {/* 1. TOP NAVBAR */}
      <nav className="h-12 border-b border-[#2d2d2d] bg-[#1f1f1f] px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Problem List</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <h1 className="text-sm font-bold text-white truncate max-w-xs md:max-w-md">
            {problem.title}
          </h1>

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getDifficultyBadge(
              problem.difficulty
            )}`}
          >
            {problem.difficulty}
          </span>

          {isProblemSolved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-600/30 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Solved
            </span>
          )}
        </div>

        {/* Center / Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCode}
            disabled={isExecuting || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#2d2d2d] hover:bg-[#383838] text-gray-200 rounded-md transition-all active:scale-95 disabled:opacity-50"
            title="Run Code (Ctrl + ')"
          >
            {isExecuting ? (
              <span className="loading loading-spinner loading-xs text-emerald-400"></span>
            ) : (
              <Play className="w-3.5 h-3.5 text-gray-300 fill-current" />
            )}
            <span>Run</span>
          </button>

          <button
            onClick={handleSubmitCode}
            disabled={isExecuting || isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Submit Solution (Ctrl + Enter)"
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-xs text-white"></span>
            ) : (
              <Send className="w-3.5 h-3.5 text-white" />
            )}
            <span>Submit</span>
          </button>

          <div className="h-4 w-px bg-[#333] mx-1"></div>

          <button
            onClick={() => setIsPlaylistModalOpen(true)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2d2d2d] rounded transition-colors"
            title="Add to Playlist"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Problem link copied to clipboard!");
            }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2d2d2d] rounded transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* 2. MAIN SPLIT WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Description / Editorial / Submissions / Hints */}
        <div className="w-1/2 flex flex-col border-r border-[#2d2d2d] bg-[#1e1e1e] overflow-hidden">
          {/* Left Panel Tabs */}
          <div className="flex items-center border-b border-[#2d2d2d] bg-[#1a1a1a] px-2 h-10 select-none">
            <button
              onClick={() => setActiveTab("description")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === "description"
                  ? "border-emerald-500 text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Description
            </button>

            <button
              onClick={() => setActiveTab("editorial")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === "editorial"
                  ? "border-emerald-500 text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Editorial
            </button>

            <button
              onClick={() => setActiveTab("submissions")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === "submissions"
                  ? "border-emerald-500 text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Submissions
            </button>

            <button
              onClick={() => setActiveTab("hints")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === "hints"
                  ? "border-emerald-500 text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Hints
            </button>
          </div>

          {/* Left Panel Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-gray-300 leading-relaxed custom-scrollbar">
            {activeTab === "description" && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">{problem.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getDifficultyBadge(
                        problem.difficulty
                      )}`}
                    >
                      {problem.difficulty}
                    </span>
                    {problem.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-0.5 rounded-full bg-[#2a2a2a] text-gray-400 border border-[#333]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-400 border-y border-[#2a2a2a] py-2 mb-6">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {submissionCount || 0} Submissions
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                      94.8% Acceptance
                    </span>
                  </div>
                </div>

                {/* Problem Statement */}
                <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-line text-base">
                  {problem.description}
                </div>

                {/* Examples */}
                {problem.examples && (
                  <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Examples
                    </h3>
                    {Object.entries(problem.examples).map(([langKey, ex], idx) => (
                      <div
                        key={langKey}
                        className="bg-[#242424] border border-[#333] rounded-lg p-4 font-mono text-xs space-y-2"
                      >
                        <div className="font-semibold text-gray-400 text-[11px] uppercase">
                          Example {idx + 1}:
                        </div>
                        <div>
                          <span className="text-emerald-400 font-bold">Input: </span>
                          <span className="text-gray-200">{ex.input}</span>
                        </div>
                        <div>
                          <span className="text-amber-400 font-bold">Output: </span>
                          <span className="text-gray-200">{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <div className="pt-1 text-gray-400 font-sans text-xs">
                            <span className="font-semibold text-gray-300">Explanation: </span>
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && (
                  <div className="pt-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                      Constraints
                    </h3>
                    <div className="bg-[#242424] border border-[#333] rounded-lg p-3 text-xs font-mono text-gray-300">
                      • {problem.constraints}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "editorial" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Editorial & Approach
                </h3>
                {problem.editorial ? (
                  <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-line leading-relaxed">
                    {problem.editorial}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-10 bg-[#242424] rounded-lg border border-[#333]">
                    No official editorial published for this problem yet.
                  </div>
                )}
              </div>
            )}

            {activeTab === "submissions" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Submission History</h3>
                  <button
                    onClick={() => id && getSubmissionForProblem(id)}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-[#242424] hover:bg-[#2e2e2e] border border-[#333] transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>
                <SubmissionsList
                  submissions={submissions?.length ? submissions : (Array.isArray(submissionList) ? submissionList : [])}
                  isLoading={isSubmissionsLoading}
                  onSelectCode={(loadedCode) => setCode(loadedCode)}
                />
              </div>
            )}

            {activeTab === "hints" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-2">Hints & Clues</h3>
                {problem.hints ? (
                  <div className="bg-[#242424] border border-[#333] p-4 rounded-lg flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-200">{problem.hints}</p>
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-10 bg-[#242424] rounded-lg border border-[#333]">
                    No hints available for this problem.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Monaco Editor + Console Drawer */}
        <div className="w-1/2 flex flex-col bg-[#1e1e1e] overflow-hidden">
          {/* Editor Header Toolbar */}
          <div className="h-10 border-b border-[#2d2d2d] bg-[#1a1a1a] px-3 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-3">
              {/* Language Dropdown */}
              <select
                className="bg-[#2a2a2a] text-gray-200 text-xs font-semibold px-2.5 py-1 rounded border border-[#3d3d3d] hover:border-gray-500 focus:outline-none focus:border-emerald-500"
                value={selectedLanguage}
                onChange={handleLanguageChange}
              >
                <option value="CPP">C++ (GCC 9.2)</option>
                <option value="JAVA">Java (OpenJDK 13)</option>
                <option value="PYTHON">Python (3.8.1)</option>
                <option value="JAVASCRIPT">JavaScript (Node.js 12)</option>
              </select>

              <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                <Info className="w-3 h-3" />
                <span>LeetCode format: no boilerplate required!</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Font Size Selector */}
              <select
                className="bg-[#2a2a2a] text-gray-300 text-xs px-2 py-1 rounded border border-[#3d3d3d] focus:outline-none"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              >
                <option value={13}>13px</option>
                <option value={15}>15px</option>
                <option value={17}>17px</option>
                <option value={19}>19px</option>
              </select>

              <button
                onClick={handleCopyCode}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2d2d2d] rounded transition-colors"
                title="Copy Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleResetCode}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2d2d2d] rounded transition-colors"
                title="Reset to Starter Template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 w-full bg-[#1e1e1e] relative">
            <Editor
              height="100%"
              language={getMonacoLanguage(selectedLanguage)}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: fontSize,
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                cursorBlinking: "smooth",
                renderLineHighlight: "all",
              }}
            />
          </div>

          {/* 3. BOTTOM CONSOLE DRAWER */}
          <div
            className={`border-t border-[#2d2d2d] bg-[#1a1a1a] transition-all flex flex-col ${
              isConsoleOpen ? "h-64" : "h-9"
            }`}
          >
            {/* Drawer Header */}
            <div className="h-9 px-3 flex items-center justify-between bg-[#1f1f1f] border-b border-[#2d2d2d] select-none shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Console</span>
                  {isConsoleOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronUp className="w-3.5 h-3.5 text-gray-500" />}
                </button>

                {isConsoleOpen && (
                  <div className="flex items-center ml-4 gap-1">
                    <button
                      onClick={() => setConsoleTab("testcase")}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        consoleTab === "testcase"
                          ? "bg-[#2d2d2d] text-white font-semibold"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      Testcase
                    </button>
                    <button
                      onClick={() => setConsoleTab("result")}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        consoleTab === "result"
                          ? "bg-[#2d2d2d] text-white font-semibold"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      Test Result
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons in Console Drawer */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={isExecuting || isSubmitting}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-[#2d2d2d] hover:bg-[#383838] text-gray-200 rounded transition-all disabled:opacity-50"
                >
                  {isExecuting ? (
                    <span className="loading loading-spinner loading-xs text-emerald-400"></span>
                  ) : (
                    <Play className="w-3 h-3 text-gray-300 fill-current" />
                  )}
                  <span>Run</span>
                </button>

                <button
                  onClick={handleSubmitCode}
                  disabled={isExecuting || isSubmitting}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-xs text-white"></span>
                  ) : (
                    <Send className="w-3 h-3 text-white" />
                  )}
                  <span>Submit</span>
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            {isConsoleOpen && (
              <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-gray-300 custom-scrollbar">
                {consoleTab === "testcase" && (
                  <div className="space-y-3">
                    {/* Case Tabs */}
                    <div className="flex items-center gap-2 select-none">
                      {customTestcases.map((tc, idx) => (
                        <button
                          key={tc.id || idx}
                          onClick={() => setActiveCaseIndex(idx)}
                          className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                            activeCaseIndex === idx
                              ? "bg-[#333] text-white border border-[#444]"
                              : "bg-[#242424] text-gray-400 hover:bg-[#2c2c2c]"
                          }`}
                        >
                          Case {idx + 1}
                        </button>
                      ))}

                      <button
                        onClick={handleAddCustomCase}
                        className="px-2 py-1 text-xs text-gray-400 hover:text-white bg-[#242424] hover:bg-[#2d2d2d] rounded transition-colors"
                        title="Add Custom Testcase"
                      >
                        +
                      </button>
                    </div>

                    {/* Active Testcase Input Box */}
                    {customTestcases[activeCaseIndex] && (
                      <div className="space-y-1.5">
                        <label className="text-gray-400 font-sans text-xs font-semibold">
                          Input:
                        </label>
                        <textarea
                          rows={3}
                          value={customTestcases[activeCaseIndex].input}
                          onChange={(e) => handleCustomInputChange(e.target.value, activeCaseIndex)}
                          className="w-full bg-[#242424] border border-[#333] rounded p-2 text-gray-200 focus:outline-none focus:border-emerald-500 font-mono text-xs resize-none"
                          placeholder="Enter stdin input..."
                        />
                      </div>
                    )}
                  </div>
                )}

                {consoleTab === "result" && (
                  <div>
                    {!currentResult ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500 font-sans">
                        <Terminal className="w-8 h-8 mb-2 stroke-1" />
                        <p>Click "Run" or "Submit" to test your code</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Status Banner */}
                        <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-2 font-sans">
                          <div className="flex items-center gap-2">
                            {currentResult.overallStatus === "Accepted" ? (
                              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Accepted</span>
                              </div>
                            ) : currentResult.overallStatus === "Compilation Error" ? (
                              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Compilation Error</span>
                              </div>
                            ) : currentResult.overallStatus === "Runtime Error" ? (
                              <div className="flex items-center gap-1.5 text-rose-400 font-bold text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>Runtime Error</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-rose-400 font-bold text-sm">
                                <XCircle className="w-4 h-4" />
                                <span>Wrong Answer</span>
                              </div>
                            )}

                            {activeResultCase?.time && (
                              <span className="text-xs text-gray-400 font-mono ml-3">
                                Runtime: {activeResultCase.time}
                              </span>
                            )}
                            {activeResultCase?.memory && (
                              <span className="text-xs text-gray-400 font-mono ml-2">
                                Memory: {activeResultCase.memory}
                              </span>
                            )}
                          </div>

                          {submission && (
                            <button
                              onClick={() => setActiveTab("submissions")}
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-sans flex items-center gap-0.5 hover:underline"
                            >
                              <span>View history</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Compiler / Error Output if present */}
                        {(activeResultCase?.compile_output || currentResult.results?.find(r => r.compile_output)?.compile_output) && (
                          <div className="bg-[#241a1a] border border-amber-900/40 rounded p-3 text-amber-300 font-mono text-xs whitespace-pre-wrap">
                            <div className="font-bold mb-1 text-amber-400 uppercase font-sans">
                              Compiler Details:
                            </div>
                            {activeResultCase?.compile_output || currentResult.results?.find(r => r.compile_output)?.compile_output}
                          </div>
                        )}

                        {activeResultCase?.stderr && (
                          <div className="bg-[#241a1a] border border-rose-900/40 rounded p-3 text-rose-300 font-mono text-xs whitespace-pre-wrap">
                            <div className="font-bold mb-1 text-rose-400 uppercase font-sans">
                              Standard Error:
                            </div>
                            {activeResultCase.stderr}
                          </div>
                        )}

                        {/* Case Selector Tabs for Results */}
                        {currentResult.results?.length > 0 && (
                          <div className="flex items-center gap-2 select-none">
                            {currentResult.results.map((r, idx) => (
                              <button
                                key={idx}
                                onClick={() => setActiveResultCaseIndex(idx)}
                                className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition-all ${
                                  activeResultCaseIndex === idx
                                    ? "bg-[#333] text-white border border-[#444]"
                                    : "bg-[#242424] text-gray-400 hover:bg-[#2c2c2c]"
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    r.passed ? "bg-emerald-400" : "bg-rose-400"
                                  }`}
                                />
                                Case {idx + 1}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Selected Case Inspection */}
                        {activeResultCase && (
                          <div className="space-y-2 bg-[#222] p-3 rounded border border-[#2d2d2d]">
                            <div>
                              <div className="text-gray-400 text-[11px] font-sans font-semibold mb-0.5">
                                Input:
                              </div>
                              <div className="bg-[#1a1a1a] p-2 rounded text-gray-200">
                                {activeResultCase.stdin || customTestcases[activeResultCaseIndex]?.input || "N/A"}
                              </div>
                            </div>

                            <div>
                              <div className="text-gray-400 text-[11px] font-sans font-semibold mb-0.5">
                                Output:
                              </div>
                              <div
                                className={`p-2 rounded ${
                                  activeResultCase.passed
                                    ? "bg-[#1a1a1a] text-gray-200"
                                    : "bg-rose-950/20 text-rose-300 border border-rose-900/30"
                                }`}
                              >
                                {activeResultCase.stdout || "(empty)"}
                              </div>
                            </div>

                            {activeResultCase.expected && (
                              <div>
                                <div className="text-gray-400 text-[11px] font-sans font-semibold mb-0.5">
                                  Expected:
                                </div>
                                <div className="bg-[#1a1a1a] p-2 rounded text-emerald-400">
                                  {activeResultCase.expected}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Playlist Modal */}
      <AddToPlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        problemId={id}
      />
    </div>
  );
};

export default ProblemPage;

export function getLanguageName(languageId) {
  const numericId = Number(languageId);
  const LANGUAGE_NAMES = {
    54: "C++",
    62: "Java",
    71: "Python",
    63: "JavaScript",
    74: "TypeScript",
  };
  return LANGUAGE_NAMES[numericId] || "Unknown";
}

export function getLanguageId(language) {
  if (!language) return 63;
  const clean = language.toString().trim().toUpperCase();
  const languageMap = {
    "CPP": 54,
    "C++": 54,
    "JAVA": 62,
    "PYTHON": 71,
    "JAVASCRIPT": 63,
    "JS": 63,
    "TYPESCRIPT": 74,
    "TS": 74,
  };
  return languageMap[clean] || 63;
}

export function getMonacoLanguage(language) {
  if (!language) return "javascript";
  const clean = language.toString().trim().toLowerCase();
  if (clean === "c++" || clean === "cpp") return "cpp";
  if (clean === "java") return "java";
  if (clean === "python" || clean === "py") return "python";
  if (clean === "typescript" || clean === "ts") return "typescript";
  return "javascript";
}
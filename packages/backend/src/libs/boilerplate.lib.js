/**
 * Boilerplate & Driver Wrapping Library for LeetLab
 * Handles clean LeetCode snippets and seamless driver code wrapping for Judge0
 */

export function normalizeLanguage(lang) {
  if (!lang) return 'JAVASCRIPT';
  const clean = lang.toString().trim().toUpperCase();
  if (clean === 'C++' || clean === 'CPP' || clean === 'GCC') return 'CPP';
  if (clean === 'JAVA') return 'JAVA';
  if (clean === 'PYTHON' || clean === 'PY' || clean === 'PYTHON3') return 'PYTHON';
  if (clean === 'JAVASCRIPT' || clean === 'JS' || clean === 'NODE') return 'JAVASCRIPT';
  if (clean === 'TYPESCRIPT' || clean === 'TS') return 'TYPESCRIPT';
  return clean;
}

export function hasUserDriver(code, language) {
  const lang = normalizeLanguage(language);
  if (!code) return false;

  if (lang === 'CPP') {
    return /\b(int|void)\s+main\s*\(/.test(code);
  }
  if (lang === 'JAVA') {
    return /public\s+static\s+void\s+main\s*\(/.test(code);
  }
  if (lang === 'PYTHON') {
    return /if\s+__name__\s*==\s*['"]__main__['"]/.test(code) ||
           /sys\.stdin/.test(code) ||
           /\binput\s*\(/.test(code);
  }
  if (lang === 'JAVASCRIPT' || lang === 'TYPESCRIPT') {
    return /fs\.readFileSync/.test(code) ||
           /require\(['"`]readline['"`]\)/.test(code) ||
           /process\.stdin/.test(code);
  }
  return false;
}

const RESERVED_KEYWORDS = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'main', 'Solution', 'return', 'sizeof', 'typeof'
]);

export function detectFunctionDetails(code, language) {
  let funcName = 'climbStairs';
  let paramCount = 1;
  let hasVectorParam = false;

  if (!code) return { funcName, paramCount, hasVectorParam };

  // Python: def climbStairs(self, n): or def climbStairs(n):
  const pyMatch = code.match(/def\s+([A-Za-z0-9_]+)\s*\(\s*(?:self\s*,?)?([^)]*)\)/);
  if (pyMatch && !RESERVED_KEYWORDS.has(pyMatch[1])) {
    funcName = pyMatch[1];
    const params = pyMatch[2].split(',').filter(p => p.trim()).length;
    return { funcName, paramCount: params || 1, hasVectorParam: false };
  }

  // JS: var climbStairs = function(...) or function climbStairs(...)
  const jsMatch = code.match(/(?:function\s+([A-Za-z0-9_]+)|(?:var|let|const)\s+([A-Za-z0-9_]+)\s*=\s*function)\s*\(([^)]*)\)/);
  if (jsMatch) {
    const name = jsMatch[1] || jsMatch[2];
    if (name && !RESERVED_KEYWORDS.has(name)) {
      funcName = name;
      const params = (jsMatch[3] || "").split(',').filter(p => p.trim()).length;
      return { funcName, paramCount: params || 1, hasVectorParam: false };
    }
  }

  // C++ / Java: returnType functionName(param1, param2)
  const cppJavaRegex = /[\w<>\[\]&*\s]+\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
  let match;
  while ((match = cppJavaRegex.exec(code)) !== null) {
    const candidate = match[1];
    if (!RESERVED_KEYWORDS.has(candidate)) {
      funcName = candidate;
      const paramStr = match[2] || "";
      const params = paramStr.split(',').filter(p => p.trim());
      paramCount = params.length || 1;
      hasVectorParam = /vector\s*</i.test(paramStr);
      return { funcName, paramCount, hasVectorParam };
    }
  }

  return { funcName, paramCount, hasVectorParam };
}

/**
 * Normalizes Java code so Judge0 compiles it cleanly in Main.java
 */
export function normalizeJavaCode(code) {
  let normalized = code;
  normalized = normalized.replace(/public\s+class\s+Solution\b/g, 'class Solution');
  
  if (/class\s+Main\b/.test(normalized) && !/public\s+class\s+Main\b/.test(normalized)) {
    normalized = normalized.replace(/class\s+Main\b/g, 'public class Main');
  }

  const imports = [];
  if (!normalized.includes('import java.util.')) imports.push('import java.util.*;');
  if (!normalized.includes('import java.io.')) imports.push('import java.io.*;');

  if (imports.length > 0) {
    normalized = imports.join('\n') + '\n\n' + normalized;
  }
  return normalized;
}

/**
 * Extracts clean user snippet and driver code if combined
 */
export function extractSnippetAndDriver(rawCode, language) {
  const lang = normalizeLanguage(language);
  if (!rawCode) return { cleanSnippet: '', driverCode: '' };

  if (lang === 'PYTHON') {
    const splitIndex = rawCode.search(/#\s*Input parsing|if\s+__name__\s*==\s*['"]__main__['"]/);
    if (splitIndex !== -1) {
      return {
        cleanSnippet: rawCode.slice(0, splitIndex).trim(),
        driverCode: rawCode.slice(splitIndex).trim()
      };
    }
  }

  if (lang === 'JAVASCRIPT' || lang === 'TYPESCRIPT') {
    const splitIndex = rawCode.search(/\/\/\s*Parse input|const\s+readline\s*=|const\s+fs\s*=/);
    if (splitIndex !== -1) {
      return {
        cleanSnippet: rawCode.slice(0, splitIndex).trim(),
        driverCode: rawCode.slice(splitIndex).trim()
      };
    }
  }

  if (lang === 'JAVA') {
    if (rawCode.includes('class Main') && rawCode.includes('public static void main')) {
      const match = rawCode.match(/public\s+[\w<>\[\]]+\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\n\s*\}/);
      if (match) {
        const [fullMethod] = match;
        const cleanSnippet = `class Solution {\n    ${fullMethod}\n}`;
        const driverCode = rawCode.replace(fullMethod, '// Solution method called from Solution class');
        return { cleanSnippet, driverCode };
      }
    }
  }

  return { cleanSnippet: rawCode, driverCode: '' };
}

/**
 * Generates an automatic driver code matching the exact function name & parameter count
 */
export function generateDefaultDriver(problem, language, userCode = '') {
  const lang = normalizeLanguage(language);
  const details = detectFunctionDetails(userCode, lang);
  const funcName = details.funcName;
  const paramCount = details.paramCount;

  if (lang === 'CPP') {
    if (paramCount === 2) {
      return `
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    cout << boolalpha;
    Solution sol;
    long long a, b;
    while (cin >> a >> b) {
        cout << sol.${funcName}(a, b) << endl;
    }
    return 0;
}
`;
    }
    return `
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    cout << boolalpha;
    Solution sol;
    long long val;
    while (cin >> val) {
        cout << sol.${funcName}(val) << endl;
    }
    return 0;
}
`;
  }

  if (lang === 'JAVA') {
    if (paramCount === 2) {
      return `
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Solution sol = new Solution();
        while (sc.hasNextInt()) {
            int a = sc.nextInt();
            if (sc.hasNextInt()) {
                int b = sc.nextInt();
                Object res = sol.${funcName}(a, b);
                if (res instanceof int[]) {
                    System.out.println(Arrays.toString((int[]) res).replace(" ", ""));
                } else {
                    System.out.println(res);
                }
            }
        }
        sc.close();
    }
}
`;
    }
    return `
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Solution sol = new Solution();
        while (sc.hasNext()) {
            if (sc.hasNextInt()) {
                int n = sc.nextInt();
                Object res = sol.${funcName}(n);
                if (res instanceof int[]) {
                    System.out.println(Arrays.toString((int[]) res).replace(" ", ""));
                } else {
                    System.out.println(res);
                }
            } else {
                sc.next();
            }
        }
        sc.close();
    }
}
`;
  }

  if (lang === 'PYTHON') {
    if (paramCount === 2) {
      return `
if __name__ == "__main__":
    import sys
    tokens = sys.stdin.read().split()
    if tokens:
        runner = None
        try:
            sol = Solution()
            runner = getattr(sol, '${funcName}', None)
        except Exception:
            pass
        if runner is None:
            runner = globals().get('${funcName}')
        if runner:
            for i in range(0, len(tokens) - 1, 2):
                try:
                    res = runner(int(tokens[i]), int(tokens[i+1]))
                    print(res)
                except Exception:
                    pass
`;
    }
    return `
if __name__ == "__main__":
    import sys
    tokens = sys.stdin.read().split()
    if tokens:
        runner = None
        try:
            sol = Solution()
            runner = getattr(sol, '${funcName}', None)
        except Exception:
            pass
        if runner is None:
            runner = globals().get('${funcName}')
        if runner:
            for tok in tokens:
                try:
                    res = runner(int(tok))
                    print(res)
                except Exception:
                    pass
`;
  }

  if (lang === 'JAVASCRIPT' || lang === 'TYPESCRIPT') {
    if (paramCount === 2) {
      return `
const fs = require('fs');
const rawInput = fs.readFileSync(0, 'utf-8').trim();
if (rawInput) {
    const tokens = rawInput.split(/\s+/).filter(Boolean);
    for (let i = 0; i + 1 < tokens.length; i += 2) {
        const a = parseInt(tokens[i], 10);
        const b = parseInt(tokens[i + 1], 10);
        let res;
        if (typeof ${funcName} === 'function') {
            res = ${funcName}(a, b);
        } else if (typeof Solution !== 'undefined') {
            const sol = new Solution();
            res = sol.${funcName}(a, b);
        }
        if (res !== undefined) {
            console.log(Array.isArray(res) ? JSON.stringify(res) : res);
        }
    }
}
`;
    }
    return `
const fs = require('fs');
const rawInput = fs.readFileSync(0, 'utf-8').trim();
if (rawInput) {
    const tokens = rawInput.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
        const n = parseInt(token, 10);
        let res;
        if (typeof ${funcName} === 'function') {
            res = ${funcName}(n);
        } else if (typeof Solution !== 'undefined') {
            const sol = new Solution();
            res = sol.${funcName}(n);
        }
        if (res !== undefined) {
            console.log(Array.isArray(res) ? JSON.stringify(res) : res);
        }
    }
}
`;
  }

  return '';
}

/**
 * Prepares the final code to be submitted to Judge0
 */
export function prepareExecutableCode(sourceCode, language, problem = null) {
  const lang = normalizeLanguage(language);
  let code = (sourceCode || '').trim();

  // If user already wrote a full program with main/stdin, let it run directly
  if (hasUserDriver(code, lang)) {
    if (lang === 'JAVA') {
      return normalizeJavaCode(code);
    }
    if (lang === 'CPP') {
      if (!code.includes('#include')) {
        code = '#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\n' + code;
      }
      return code;
    }
    return code;
  }

  let driver = problem?.driverCode?.[lang] || problem?.driverCode?.[lang.toLowerCase()];

  if (!driver && problem?.codeSnippets) {
    const snippetInProblem = problem.codeSnippets[lang] || problem.codeSnippets[lang.toLowerCase()];
    if (snippetInProblem) {
      const extracted = extractSnippetAndDriver(snippetInProblem, lang);
      if (extracted.driverCode) {
        driver = extracted.driverCode;
      }
    }
  }

  if (!driver) {
    driver = generateDefaultDriver(problem, lang, code);
  }

  if (lang === 'CPP') {
    // 1. Auto-wrap into class Solution if missing
    if (!/\bclass\s+Solution\b/.test(code)) {
      code = `class Solution {\npublic:\n${code}\n};`;
    } else {
      // Ensure public: is present inside class Solution
      if (!/\bpublic\s*:/.test(code)) {
        code = code.replace(/(\bclass\s+Solution\s*\{)/, '$1\npublic:\n');
      }
      // Ensure class definition ends with a semicolon
      if (!/;\s*$/.test(code)) {
        code = code.replace(/}(\s*)$/, '};$1');
      }
    }

    let headers = '';
    if (!code.includes('#include <iostream>')) headers += '#include <iostream>\n';
    if (!code.includes('#include <vector>')) headers += '#include <vector>\n';
    if (!code.includes('#include <string>')) headers += '#include <string>\n';
    if (!code.includes('#include <sstream>')) headers += '#include <sstream>\n';
    if (!code.includes('#include <algorithm>')) headers += '#include <algorithm>\n';
    if (!code.includes('#include <map>')) headers += '#include <map>\n';
    if (!code.includes('#include <unordered_map>')) headers += '#include <unordered_map>\n';
    if (!code.includes('#include <set>')) headers += '#include <set>\n';
    if (!code.includes('#include <unordered_set>')) headers += '#include <unordered_set>\n';
    if (!code.includes('#include <queue>')) headers += '#include <queue>\n';
    if (!code.includes('#include <stack>')) headers += '#include <stack>\n';
    if (!code.includes('#include <cmath>')) headers += '#include <cmath>\n';
    if (!code.includes('#include <climits>')) headers += '#include <climits>\n';
    if (!code.includes('using namespace std;')) headers += 'using namespace std;\n';

    const vectorPrintHelper = `
template <typename T>
ostream& operator<<(ostream& os, const vector<T>& v) {
    os << "[";
    for (size_t i = 0; i < v.size(); ++i) {
        os << v[i];
        if (i + 1 < v.size()) os << ",";
    }
    os << "]";
    return os;
}
`;
    
    return `${headers}\n${vectorPrintHelper}\n${code}\n\n${driver}`;
  }

  if (lang === 'JAVA') {
    if (!/\bclass\s+Solution\b/.test(code)) {
      code = `class Solution {\n    ${code}\n}`;
    } else {
      code = code.replace(/public\s+class\s+Solution\b/g, 'class Solution');
    }
    let finalCode = `import java.util.*;\nimport java.io.*;\n\n${code}\n\n${driver}`;
    return normalizeJavaCode(finalCode);
  }

  if (lang === 'PYTHON') {
    return `${code}\n\n${driver}`;
  }

  if (lang === 'JAVASCRIPT' || lang === 'TYPESCRIPT') {
    return `${code}\n\n${driver}`;
  }

  return code;
}

export function cleanCodeSnippetsForProblem(problem) {
  if (!problem) return problem;

  const rawSnippets = problem.codeSnippets || {};
  const cleaned = {};
  const drivers = {};

  const supportedLangs = ["CPP", "JAVA", "PYTHON", "JAVASCRIPT"];
  
  for (const lang of supportedLangs) {
    const raw = rawSnippets[lang] || rawSnippets[lang.toLowerCase()] || "";
    if (raw) {
      const extracted = extractSnippetAndDriver(raw, lang);
      cleaned[lang] = extracted.cleanSnippet || raw;
      cleaned[lang.toLowerCase()] = cleaned[lang];
      if (extracted.driverCode) {
        drivers[lang] = extracted.driverCode;
        drivers[lang.toLowerCase()] = extracted.driverCode;
      }
    }
  }

  if (!cleaned.CPP) {
    const title = problem.title || "";
    let func = "int climbStairs(int n)";
    if (title.toLowerCase().includes("two sum")) func = "vector<int> twoSum(vector<int>& nums, int target)";
    else if (title.toLowerCase().includes("add two")) func = "int addTwoNumbers(int a, int b)";

    const cppSnippet = `class Solution {\npublic:\n    ${func} {\n        // Write your solution here\n        return 0;\n    }\n};`;
    cleaned.CPP = cppSnippet;
    cleaned.cpp = cppSnippet;
  }

  if (!cleaned.JAVA) {
    const title = problem.title || "";
    let func = "public int climbStairs(int n)";
    if (title.toLowerCase().includes("two sum")) func = "public int[] twoSum(int[] nums, int target)";
    else if (title.toLowerCase().includes("add two")) func = "public int addTwoNumbers(int a, int b)";

    const javaSnippet = `class Solution {\n    ${func} {\n        // Write your solution here\n        return 0;\n    }\n};`;
    cleaned.JAVA = javaSnippet;
    cleaned.java = javaSnippet;
  }

  return {
    ...problem,
    codeSnippets: cleaned,
    driverCode: { ...(problem.driverCode || {}), ...drivers }
  };
}

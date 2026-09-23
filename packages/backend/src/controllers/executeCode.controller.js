import { db } from "../libs/db.js";
import {
  getLanguageName,
  pollBatchResults,
  submitBatch,
} from "../libs/judge0.lib.js";
import { prepareExecutableCode } from "../libs/boilerplate.lib.js";

const normalizeOutput = (str) => {
  if (str === null || str === undefined) return "";
  let clean = String(str).trim().replace(/\r\n/g, "\n");
  // Normalize array output spacing: e.g. "[0, 1]" -> "[0,1]"
  clean = clean.replace(/\[\s*([^\]]*?)\s*\]/g, (_, inner) => {
    return '[' + inner.split(',').map((s) => s.trim()).join(',') + ']';
  });
  return clean;
};

export const runCode = async (req, res) => {
  try {
    const { source_code, language_id, stdin, expected_outputs, problemId } = req.body;

    if (!Array.isArray(stdin) || stdin.length === 0) {
      return res.status(400).json({ error: "Invalid or Missing test cases" });
    }

    let problem = null;
    if (problemId) {
      problem = await db.problem.findUnique({ where: { id: problemId } });
    }

    const languageName = getLanguageName(language_id);
    const executableCode = prepareExecutableCode(source_code, languageName, problem);

    const submissions = stdin.map((input, i) => ({
      source_code: executableCode,
      language_id,
      stdin: input,
      expected_output: expected_outputs && expected_outputs[i] ? expected_outputs[i] : undefined,
    }));

    const submitResponse = await submitBatch(submissions);
    const tokens = submitResponse.map((r) => r.token);
    const results = await pollBatchResults(tokens);

    let allPassed = true;
    let overallStatus = "Accepted";

    const detailedResults = results.map((result, i) => {
      const stdout = normalizeOutput(result.stdout);
      const expected = expected_outputs ? normalizeOutput(expected_outputs[i]) : "";
      const passed = expected_outputs ? stdout === expected : true;

      if (!passed) allPassed = false;

      let statusDesc = result.status?.description || "Unknown";
      if (result.compile_output) {
        overallStatus = "Compilation Error";
        statusDesc = "Compilation Error";
      } else if (result.stderr && result.status?.id !== 3) {
        overallStatus = "Runtime Error";
        statusDesc = "Runtime Error";
      } else if (!passed && overallStatus === "Accepted") {
        overallStatus = "Wrong Answer";
      }

      return {
        testCase: i + 1,
        passed,
        stdout,
        expected,
        stdin: stdin[i],
        stderr: result.stderr || null,
        compile_output: result.compile_output || null,
        status: statusDesc,
        memory: result.memory ? `${result.memory} KB` : undefined,
        time: result.time ? `${result.time} s` : undefined,
      };
    });

    if (detailedResults.some(r => r.compile_output)) {
      overallStatus = "Compilation Error";
    }

    return res.status(200).json({
      success: true,
      message: "Code run complete",
      allPassed,
      overallStatus,
      results: detailedResults,
      submission: {
        status: overallStatus,
        language: languageName,
        sourceCode: source_code,
        testCases: detailedResults,
        memory: JSON.stringify(detailedResults.map(r => r.memory)),
        time: JSON.stringify(detailedResults.map(r => r.time)),
      }
    });
  } catch (error) {
    console.error("Error running code:", error);
    res.status(500).json({ error: error.message || "Failed to run code" });
  }
};

export const executeCode = async (req, res) => {
  try {
    const { source_code, language_id, stdin, expected_outputs, problemId } =
      req.body;

    const userId = req.user.id;

    if (
      !Array.isArray(stdin) ||
      stdin.length === 0 ||
      !Array.isArray(expected_outputs) ||
      expected_outputs.length !== stdin.length
    ) {
      return res.status(400).json({ error: "Invalid or Missing test cases" });
    }

    let problem = null;
    if (problemId) {
      problem = await db.problem.findUnique({ where: { id: problemId } });
    }

    const languageName = getLanguageName(language_id);
    const executableCode = prepareExecutableCode(source_code, languageName, problem);

    const submissions = stdin.map((input, i) => ({
      source_code: executableCode,
      language_id,
      stdin: input,
      expected_output: expected_outputs[i],
    }));

    const submitResponse = await submitBatch(submissions);
    const tokens = submitResponse.map((r) => r.token);
    const results = await pollBatchResults(tokens);

    let allPassed = true;
    let overallStatus = "Accepted";

    const detailedResults = results.map((result, i) => {
      const stdout = normalizeOutput(result.stdout);
      const expected = normalizeOutput(expected_outputs[i]);
      const passed = stdout === expected;

      if (!passed) allPassed = false;

      let statusDesc = result.status?.description || "Unknown";
      if (result.compile_output) {
        overallStatus = "Compilation Error";
        statusDesc = "Compilation Error";
      } else if (result.stderr && result.status?.id !== 3) {
        overallStatus = "Runtime Error";
        statusDesc = "Runtime Error";
      } else if (!passed && overallStatus === "Accepted") {
        overallStatus = "Wrong Answer";
      }

      return {
        testCase: i + 1,
        passed,
        stdout,
        expected,
        stdin: stdin[i],
        stderr: result.stderr || null,
        compile_output: result.compile_output || null,
        status: statusDesc,
        memory: result.memory ? `${result.memory} KB` : undefined,
        time: result.time ? `${result.time} s` : undefined,
      };
    });

    if (detailedResults.some(r => r.compile_output)) {
      overallStatus = "Compilation Error";
    }

    // store submission summary
    const submission = await db.submission.create({
      data: {
        userId,
        problemId,
        sourceCode: source_code,
        language: languageName,
        stdin: stdin.join("\n"),
        stdout: JSON.stringify(detailedResults.map((r) => r.stdout)),
        stderr: detailedResults.some((r) => r.stderr)
          ? JSON.stringify(detailedResults.map((r) => r.stderr))
          : null,
        compileOutput: detailedResults.some((r) => r.compile_output)
          ? JSON.stringify(detailedResults.map((r) => r.compile_output))
          : null,
        status: overallStatus,
        memory: detailedResults.some((r) => r.memory)
          ? JSON.stringify(detailedResults.map((r) => r.memory))
          : null,
        time: detailedResults.some((r) => r.time)
          ? JSON.stringify(detailedResults.map((r) => r.time))
          : null,
      },
    });

    if (allPassed && overallStatus === "Accepted") {
      await db.problemSolved.upsert({
        where: {
          userId_problemId: {
            userId,
            problemId,
          },
        },
        update: {},
        create: {
          userId,
          problemId,
        },
      });
    }

    const testCaseResults = detailedResults.map((result) => ({
      submissionId: submission.id,
      testCase: result.testCase,
      passed: result.passed,
      stdout: result.stdout,
      expected: result.expected,
      stderr: result.stderr,
      compileOutput: result.compile_output,
      status: result.status,
      memory: result.memory,
      time: result.time,
    }));

    await db.testCaseResult.createMany({
      data: testCaseResults,
    });

    const submissionWithTestCase = await db.submission.findUnique({
      where: {
        id: submission.id,
      },
      include: {
        testCases: true,
      },
    });

    res.status(200).json({
      success: true,
      message: allPassed ? "Congratulations! Solution Accepted!" : "Submission Evaluated",
      submission: submissionWithTestCase,
      allPassed,
    });
  } catch (error) {
    console.error("Error executing code:", error);
    res.status(500).json({ error: error.message || "Failed to execute code" });
  }
};

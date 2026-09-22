import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useExecutionStore = create((set) => ({
  isExecuting: false,
  isSubmitting: false,
  runResult: null,
  submission: null,

  runCode: async (source_code, language_id, stdin, expected_outputs, problemId) => {
    try {
      set({ isExecuting: true });
      const res = await axiosInstance.post("/execute-code/run", {
        source_code,
        language_id,
        stdin,
        expected_outputs,
        problemId,
      });

      set({ runResult: res.data, submission: null, lastAction: 'run' });
      if (res.data.overallStatus === "Accepted") {
        toast.success("Test cases passed!");
      } else if (res.data.overallStatus === "Compilation Error") {
        toast.error("Compilation Error");
      } else if (res.data.overallStatus === "Runtime Error") {
        toast.error("Runtime Error");
      } else {
        toast.error("Wrong Answer on some test cases");
      }
      return res.data;
    } catch (error) {
      console.error("Error running code", error);
      toast.error(error.response?.data?.error || "Error running code");
      return null;
    } finally {
      set({ isExecuting: false });
    }
  },

  submitCode: async (source_code, language_id, stdin, expected_outputs, problemId) => {
    try {
      set({ isSubmitting: true });
      const res = await axiosInstance.post("/execute-code/submit", {
        source_code,
        language_id,
        stdin,
        expected_outputs,
        problemId,
      });

      set({ submission: res.data.submission, runResult: null, lastAction: 'submit' });

      if (res.data.allPassed) {
        toast.success(res.data.message || "Solution Accepted!");
      } else {
        toast.error(res.data.submission?.status || "Solution failed some test cases");
      }
      return res.data;
    } catch (error) {
      console.error("Error submitting code", error);
      toast.error(error.response?.data?.error || "Error submitting code");
      return null;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Legacy alias
  executeCode: async (source_code, language_id, stdin, expected_outputs, problemId) => {
    return useExecutionStore.getState().submitCode(source_code, language_id, stdin, expected_outputs, problemId);
  },

  clearResults: () => set({ runResult: null, submission: null }),
}));
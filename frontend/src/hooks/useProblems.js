import { useState, useEffect } from "react";
import { problemApi } from "../api/problems";

export function useProblems(filters = {}) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await problemApi.getProblems(filters);
        setProblems(data.problems || []);
        setTotal(data.total || 0);
      } catch (err) {
        setError(err.message);
        // Fallback to local problems if API fails
        const { PROBLEMS } = await import("../data/problems.js");
        setProblems(Object.values(PROBLEMS));
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [filters.difficulty, filters.limit, filters.skip]);

  return { problems, loading, error, total };
}

export function useProblem(slug) {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    const fetchProblem = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await problemApi.getProblemBySlug(slug);
        setProblem(data.problem);
      } catch (err) {
        setError(err.message);
        // Fallback to local problem
        const { PROBLEMS } = await import("../data/problems.js");
        const local = Object.values(PROBLEMS).find(p => p.id === slug);
        if (local) setProblem(local);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [slug]);

  return { problem, loading, error };
}


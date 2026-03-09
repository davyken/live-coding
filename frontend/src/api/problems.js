import axiosInstance from "../lib/axios";

export const problemApi = {
  // Get all problems with optional filters
  getProblems: async (params = {}) => {
    const response = await axiosInstance.get("/problems", { params });
    return response.data;
  },

  // Get a single problem by slug
  getProblemBySlug: async (slug) => {
    const response = await axiosInstance.get(`/problems/${slug}`);
    return response.data;
  },

  // Search problems
  searchProblems: async (query, limit = 20) => {
    const response = await axiosInstance.get("/problems/search", {
      params: { q: query, limit },
    });
    return response.data;
  },
};


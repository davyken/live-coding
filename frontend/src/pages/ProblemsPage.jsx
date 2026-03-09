import { useState, useEffect } from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";

import { PROBLEMS as LOCAL_PROBLEMS } from "../data/problems";
import { ChevronRightIcon, Code2Icon, Loader2Icon, SearchIcon } from "lucide-react";
import { getDifficultyBadgeClass } from "../lib/utils";
import { problemApi } from "../api/problems";

function ProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from LeetCode API
        const params = { limit: 20 };
        if (difficultyFilter) params.difficulty = difficultyFilter;
        
        const data = await problemApi.getProblems(params);
        setProblems(data.problems || []);
      } catch (err) {
        console.error("Failed to fetch from LeetCode:", err);
        // Fallback to local problems
        setProblems(Object.values(LOCAL_PROBLEMS));
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [difficultyFilter]);

  // Filter by search query
  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const easyProblemsCount = filteredProblems.filter((p) => p.difficulty === "Easy").length;
  const mediumProblemsCount = filteredProblems.filter((p) => p.difficulty === "Medium").length;
  const hardProblemsCount = filteredProblems.filter((p) => p.difficulty === "Hard").length;

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Practice Problems</h1>
          <p className="text-base-content/70">
            {problems.length > 0 
              ? `Solve ${problems.length}+ problems from LeetCode` 
              : "Sharpen your coding skills with these curated problems"}
          </p>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-base-content/50" />
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered w-full pl-10"
              />
            </div>
          </div>
          <select
            className="select select-bordered"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2Icon className="size-10 animate-spin text-primary" />
            <span className="ml-3 text-lg">Loading problems from LeetCode...</span>
          </div>
        )}

        {/* PROBLEMS LIST */}
        {!loading && (
          <div className="space-y-4">
            {filteredProblems.length === 0 ? (
              <div className="text-center py-12 text-base-content/60">
                No problems found. Try a different search.
              </div>
            ) : (
              filteredProblems.map((problem) => (
                <Link
                  key={problem.id}
                  to={`/problem/${problem.id}`}
                  className="card bg-base-100 hover:scale-[1.01] transition-transform"
                >
                  <div className="card-body">
                    <div className="flex items-center justify-between gap-4">
                      {/* LEFT SIDE */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Code2Icon className="size-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h2 className="text-xl font-bold">{problem.title}</h2>
                              <span className={`badge ${getDifficultyBadgeClass(problem.difficulty)}`}>
                                {problem.difficulty}
                              </span>
                            </div>
                            <p className="text-sm text-base-content/60"> {problem.category}</p>
                          </div>
                        </div>
                        <p className="text-base-content/80 mb-3 line-clamp-2">
                          {problem.description?.text || "Solve this algorithm problem"}
                        </p>
                      </div>
                      {/* RIGHT SIDE */}

                      <div className="flex items-center gap-2 text-primary">
                        <span className="font-medium">Solve</span>
                        <ChevronRightIcon className="size-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* STATS FOOTER */}
        <div className="mt-12 card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="stats stats-vertical lg:stats-horizontal">
              <div className="stat">
                <div className="stat-title">Total Problems</div>
                <div className="stat-value text-primary">{filteredProblems.length}</div>
              </div>

              <div className="stat">
                <div className="stat-title">Easy</div>
                <div className="stat-value text-success">{easyProblemsCount}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Medium</div>
                <div className="stat-value text-warning">{mediumProblemsCount}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Hard</div>
                <div className="stat-value text-error">{hardProblemsCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProblemsPage;

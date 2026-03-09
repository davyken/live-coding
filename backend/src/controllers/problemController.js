import fetch from "node-fetch";

// LeetCode GraphQL query to fetch problems
const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

// Local fallback problems
const LOCAL_PROBLEMS = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    category: "Array • Hash Table",
    description: {
      text: "Given an array of integers nums and an integer target, return indices of the two numbers in the array such that they add up to target.",
      notes: ["You may assume that each input would have exactly one solution."],
      examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]" }]
    },
    constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹"],
    starterCode: { javascript: "function twoSum(nums, target) {\n  // Write your solution here\n}\n", python: "def twoSum(nums, target):\n    pass\n" }
  },
  {
    id: "add-two-numbers",
    title: "Add Two Numbers",
    difficulty: "Medium",
    category: "Linked List • Math",
    description: { text: "You are given two non-empty linked lists representing two non-negative integers.", notes: [], examples: [] },
    constraints: ["0 ≤ node.val ≤ 9"],
    starterCode: { javascript: "function ListNode(val) { this.val = val; this.next = null; }\n", python: "" }
  },
  {
    id: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    category: "Hash Table • String • Sliding Window",
    description: { text: "Given a string s, find the length of the longest substring without repeating characters.", notes: [], examples: [] },
    constraints: ["0 ≤ s.length ≤ 5 * 10⁴"],
    starterCode: { javascript: "function lengthOfLongestSubstring(s) {\n  // Write your solution here\n}\n", python: "def lengthOfLongestSubstring(s):\n    pass\n" }
  },
  {
    id: "median-of-two-sorted-arrays",
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    category: "Array • Binary Search • Divide and Conquer",
    description: { text: "Given two sorted arrays nums1 and nums2 of size m and n, return the median of the two sorted arrays.", notes: [], examples: [] },
    constraints: ["nums1.length == m", "nums2.length == n"],
    starterCode: { javascript: "function findMedianSortedArrays(nums1, nums2) {\n  // Write your solution here\n}\n", python: "def findMedianSortedArrays(nums1, nums2):\n    pass\n" }
  }
];

function getLocalProblems() {
  return LOCAL_PROBLEMS;
}

function transformLocalProblem(problem) {
  return {
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    category: problem.category,
    description: problem.description,
    examples: problem.description?.examples || [],
    constraints: problem.constraints || [],
    starterCode: problem.starterCode || { javascript: "", python: "", java: "" },
    expectedOutput: { javascript: "", python: "", java: "" },
    isPaidOnly: false,
    source: "local"
  };
}

const problemsQuery = `
query problemsetQuestionListV2($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionListV2(
    categorySlug: $categorySlug
    limit: $limit
    skip: $skip
    filters: $filters
  ) {
    questions {
      title
      titleSlug
      difficulty
      topicTags {
        name
        slug
      }
      isPaidOnly
    }
    totalTotal
  }
}
`;

const problemDetailQuery = `
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    title
    titleSlug
    difficulty
    topicTags {
      name
      slug
    }
    content
    codeSnippets {
      lang
      langSlug
      code
    }
    exampleTestcases
    hints
    solution {
      content
    }
  }
}
`;

// Transform LeetCode problem to our format
function transformProblem(question) {
  const langSlug = "javascript";
  
  // Get JavaScript starter code
  const jsSnippet = question.codeSnippets?.find(s => s.langSlug === "javascript") || 
                    question.codeSnippets?.[0];
  
  const pythonSnippet = question.codeSnippets?.find(s => s.langSlug === "python3");
  const javaSnippet = question.codeSnippets?.find(s => s.langSlug === "java");

  // Parse content to extract description
  const description = question.content 
    ? extractDescription(question.content)
    : { text: `Solve ${question.title}`, notes: [], examples: [] };

  // Generate expected output placeholder (user must run to verify)
  const expectedOutput = {
    javascript: "", // Will be determined by user's solution
    python: "",
    java: ""
  };

  return {
    id: question.titleSlug,
    title: question.title,
    difficulty: question.difficulty,
    category: question.topicTags?.map(t => t.name).join(" • ") || "Algorithm",
    description,
    examples: description.examples,
    constraints: extractConstraints(question.content),
    starterCode: {
      javascript: jsSnippet?.code || "",
      python: pythonSnippet?.code || "",
      java: javaSnippet?.code || ""
    },
    expectedOutput,
    isPaidOnly: question.isPaidOnly,
    source: "leetcode"
  };
}

function extractDescription(htmlContent) {
  // Simple extraction - in production you'd use a proper HTML parser
  let text = htmlContent
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/&amp;/g, "&")
    .trim();

  return {
    text: text.substring(0, 500), // First 500 chars as description
    notes: [],
    examples: []
  };
}

function extractConstraints(htmlContent) {
  // Try to extract constraints from content
  const constraintMatch = htmlContent.match(/Constraints:([\s\S]*?)(?=Example|$)/i);
  if (constraintMatch) {
    const constraints = constraintMatch[1]
      .replace(/<[^>]*>/g, "")
      .split("\n")
      .map(c => c.trim())
      .filter(c => c.length > 0)
      .slice(0, 5);
    return constraints;
  }
  return ["1 ≤ n ≤ 10^5"];
}

export async function getProblems(req, res) {
  try {
    const { limit = 50, skip = 0, difficulty } = req.query;

    const filters = {};
    if (difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)) {
      filters.difficulty = difficulty;
    }

    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: problemsQuery,
        variables: {
          categorySlug: "",
          limit: parseInt(limit),
          skip: parseInt(skip),
          filters
        }
      })
    });

    const data = await response.json();
    
    if (!data.data?.problemsetQuestionListV2) {
      return res.status(500).json({ message: "Failed to fetch problems from LeetCode" });
    }

    const questions = data.data.problemsetQuestionListV2.questions
      .filter(q => !q.isPaidOnly) // Filter out paid problems
      .map(transformProblem);

    res.status(200).json({
      problems: questions,
      total: data.data.problemsetQuestionListV2.totalTotal
    });
  } catch (error) {
    console.error("Error fetching LeetCode problems:", error);
    
    // Return fallback problems when LeetCode API is unavailable
    const fallbackProblems = getLocalProblems();
    const filtered = fallbackProblems.slice(0, 50).map(transformLocalProblem);
    
    res.status(200).json({
      problems: filtered,
      total: filtered.length
    });
  }
}

export async function getProblemBySlug(req, res) {
  try {
    const { slug } = req.params;

    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: problemDetailQuery,
        variables: { titleSlug: slug }
      })
    });

    const data = await response.json();
    
    if (!data.data?.question) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const problem = transformProblem(data.data.question);
    
    // Include example test cases for verification
    if (data.data.question.exampleTestcases) {
      problem.exampleTestcases = data.data.question.exampleTestcases;
    }

    res.status(200).json({ problem });
  } catch (error) {
    console.error("Error fetching problem details:", error);
    res.status(500).json({ message: "Failed to fetch problem details" });
  }
}

export async function searchProblems(req, res) {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query required" });
    }

    // First get all problems then filter (LeetCode doesn't have good search API)
    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: problemsQuery,
        variables: {
          categorySlug: "",
          limit: 100,
          skip: 0,
          filters: {}
        }
      })
    });

    const data = await response.json();
    
    if (!data.data?.problemsetQuestionListV2) {
      return res.status(500).json({ message: "Failed to search problems" });
    }

    // Filter by search query
    const searchLower = q.toLowerCase();
    const questions = data.data.problemsetQuestionListV2.questions
      .filter(q => 
        !q.isPaidOnly && 
        (q.title.toLowerCase().includes(searchLower) || 
         q.topicTags?.some(t => t.name.toLowerCase().includes(searchLower)))
      )
      .slice(0, parseInt(limit))
      .map(transformProblem);

    res.status(200).json({ problems: questions });
  } catch (error) {
    console.error("Error searching problems:", error);
    res.status(500).json({ message: "Failed to search problems" });
  }
}


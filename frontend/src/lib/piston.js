// Code execution service
// Note: Public code execution APIs (Piston, JDoodle) are now whitelist-only
// For production, host your own Piston instance using Docker:
// docker run -d -v /var/run/docker.sock:/var/run/docker.sock --name piston ghcr.io/engineerman/piston

const LANGUAGE_VERSIONS = {
  javascript: { language: "javascript", version: "18.15.0" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
};

// Mock execution for testing when no API is available
function mockExecute(language, code) {
  // Simple mock that just returns the code output for testing
  // In production, replace with your own Piston instance
  return {
    success: true,
    output: `[Mock Output - Code execution requires a hosted Piston instance]\n\nCode (${language}):\n${code.substring(0, 100)}...\n\nTo enable real code execution:\n1. Install Docker\n2. Run: docker run -d -p 2000:2000 ghcr.io/engineerman/piston\n3. Update API_URL in this file to http://localhost:2000`,
  };
}

/**
 * @param {string} language - programming language
 * @param {string} code - source code to execute
 * @returns {Promise<{success:boolean, output?:string, error?: string}>}
 */
export async function executeCode(language, code) {
  try {
    const languageConfig = LANGUAGE_VERSIONS[language];

    if (!languageConfig) {
      return {
        success: false,
        error: `Unsupported language: ${language}`,
      };
    }

    // For now, return mock output - requires hosting your own Piston
    // TODO: Replace with your hosted Piston API URL
    return mockExecute(language, code);

    /* 
    // When you have your own Piston instance, use this code:
    const PISTON_API = "http://localhost:2000"; // Your hosted Piston URL
    
    const response = await fetch(`${PISTON_API}/api/v1/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: languageConfig.language,
        version: languageConfig.version,
        files: [
          {
            name: `main.${getFileExtension(language)}`,
            content: code,
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
      };
    }

    const data = await response.json();

    const output = data.run?.output || "";
    const stderr = data.run?.stderr || "";

    if (stderr) {
      return {
        success: false,
        output: output,
        error: stderr,
      };
    }

    return {
      success: true,
      output: output || "No output",
    };
    */
  } catch (error) {
    return {
      success: false,
      error: `Failed to execute code: ${error.message}`,
    };
  }
}

function getFileExtension(language) {
  const extensions = {
    javascript: "js",
    python: "py",
    java: "java",
  };

  return extensions[language] || "txt";
}

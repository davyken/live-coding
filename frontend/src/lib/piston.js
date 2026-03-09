// Code execution service
// For JavaScript, we execute directly in the browser
// For Python/Java, you can host your own Piston instance using Docker:
// docker run -d -v /var/run/docker.sock:/var/run/docker.sock --name piston ghcr.io/engineerman/piston

const LANGUAGE_VERSIONS = {
  javascript: { language: "javascript", version: "18.15.0" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
};

// Execute JavaScript code in the browser
function executeJavaScript(code) {
  const logs = [];
  
  // Capture output by creating a mock console in the scope
  const mockConsole = {
    log: (...args) => {
      logs.push(args.map(formatOutput).join(" "));
    },
    error: (...args) => {
      logs.push("Error: " + args.map(formatOutput).join(" "));
    },
    warn: (...args) => {
      logs.push("Warning: " + args.map(formatOutput).join(" "));
    }
  };

  try {
    // Wrap code in an IIFE that uses our mock console
    const wrappedCode = `
      (function(console) {
        "use strict";
        ${code}
      })(mockConsole);
    `;
    
    // Create function with mockConsole in scope
    const fn = new Function("mockConsole", wrappedCode);
    fn(mockConsole);
    
    return {
      success: true,
      output: logs.join("\n"),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: logs.join("\n"),
    };
  }
}

// Format output for console.log
function formatOutput(arg) {
  if (arg === null) return "null";
  if (arg === undefined) return "undefined";
  if (typeof arg === "object") {
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
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

    // Execute JavaScript directly in the browser
    if (language === "javascript") {
      return executeJavaScript(code);
    }

    // For Python and Java, try to use Piston API
    // You can host your own Piston instance for production
    const PISTON_API = "https://emkc.org/api/v2/piston"; // Public Piston API
    
    const response = await fetch(`${PISTON_API}/execute`, {
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
    const compileOutput = data.compile?.output || "";

    if (stderr || compileOutput) {
      return {
        success: false,
        output: output,
        error: stderr || compileOutput,
      };
    }

    return {
      success: true,
      output: output || "No output",
    };
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

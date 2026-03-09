function OutputPanel({ output }) {
  return (
    <div className="h-full bg-base-100 flex flex-col">
      <div className="px-4 py-2 bg-base-200 border-b border-base-300 font-semibold text-sm flex items-center justify-between">
        <span>Output</span>
        {output?.compared && (
          <span
            className={`badge badge-sm ${output.isCorrect ? "badge-success" : "badge-error"}`}
          >
            {output.isCorrect ? "✓ Correct" : "✗ Incorrect"}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {output === null ? (
          <p className="text-base-content/50 text-sm">Click "Run Code" to see the output here...</p>
        ) : output.success ? (
          <div>
            <pre className="text-sm font-mono text-success whitespace-pre-wrap">{output.output}</pre>
            
            {/* Show comparison results */}
            {output.compared && (
              <div className="mt-4 pt-4 border-t border-base-300">
                <h4 className="font-semibold text-sm mb-2">Test Results:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-medium min-w-[80px]">Your output:</span>
                    <code className={output.isCorrect ? "text-success" : "text-error"}>
                      {output.output}
                    </code>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium min-w-[80px]">Expected:</span>
                    <code className="text-base-content">{output.expectedOutput}</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {output.output && (
              <pre className="text-sm font-mono text-base-content whitespace-pre-wrap mb-2">
                {output.output}
              </pre>
            )}
            <pre className="text-sm font-mono text-error whitespace-pre-wrap">{output.error}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
export default OutputPanel;

import { useState } from "react";
import axios from "axios";

export default function ResumeAnalyzer() {
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeResume = async () => {
    if (!resumeText.trim()) return alert("Please paste your resume text first!");

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/ai/analyze", {
        resumeText,
      });
      setResult(response.data.output);
    } catch {
      alert("Error analyzing resume. Check backend or API key.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "auto" }}>
      <h2>AI Resume Analyzer</h2>
      <textarea
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
        placeholder="Paste your resume text here..."
        rows="8"
        style={{
          width: "100%",
          padding: "1rem",
          marginBottom: "1rem",
          borderRadius: "6px",
          border: "1px solid #ccc",
          fontSize: "1rem",
        }}
      />
      <button onClick={analyzeResume} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>

      {result && (
        <div style={{
          background: "#fff",
          borderRadius: "8px",
          padding: "1rem",
          marginTop: "1.5rem",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}>
          <h3>AI Analysis Result:</h3>
          <pre style={{
            background: "#f8f8f8",
            padding: "1rem",
            borderRadius: "6px",
            overflowX: "auto"
          }}>{result}</pre>
        </div>
      )}
    </div>
  );
}

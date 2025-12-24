// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>

//           <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-3xl font-bold">
//             Tailwind is working 🚀
//           </div>

//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  useNavigate,
} from 'react-router-dom';

export default function App() {
  return (
    <Router>
      <nav style={{ padding: "1rem", background: "#222", color: "white" }}>
        <Link to="/" style={{ marginRight: "1rem", color: "white" }}>Home</Link>
        <Link to="/analyze" style={{ color: "white" }}>Resume Analyzer</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<ResumeAnalyzer />} />
      </Routes>
    </Router>
  );
}

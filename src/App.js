import React, { useEffect, useState } from "react";
import {
  connect,
  sendCodeUpdate,
  sendCursorUpdate,
  setOnMessageCallback,
  setOnCursorUpdate,
  setOnError,
  subscribeToDocument,
  disconnect
} from "./websocket";
import MonacoEditor from "react-monaco-editor";

const SUPPORTED_LANGUAGES = [
  { id: "javascript", name: "JavaScript" },
  { id: "typescript", name: "TypeScript" },
  { id: "python", name: "Python" },
  { id: "java", name: "Java" },
  { id: "html", name: "HTML" },
  { id: "css", name: "CSS" }
];

function App() {
  const [code, setCode] = useState("");
  const [username] = useState("User" + Math.floor(Math.random() * 100));
  const [cursorPositions, setCursorPositions] = useState({});
  const [language, setLanguage] = useState("javascript");
  const [documentId, setDocumentId] = useState("");
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (documentId) {
      setOnMessageCallback((update) => {
        console.log("Received message callback:", update);
        if (update.documentId === documentId) {
          setCode(update.content);
        }
      });

      setOnCursorUpdate((cursorData) => {
        console.log("Received cursor update callback:", cursorData);
        if (cursorData.documentId === documentId) {
          setCursorPositions(prev => ({
            ...prev,
            [cursorData.sender]: {
              line: cursorData.line,
              column: cursorData.column,
              color: cursorData.color
            }
          }));
        }
      });

      setOnError((errorMessage) => {
        console.log("Received error callback:", errorMessage);
        setError(errorMessage);
        setTimeout(() => setError(null), 5000);
      });

      connect();
      setIsConnected(true);

      subscribeToDocument(documentId);

      return () => {
        disconnect();
        setIsConnected(false);
      };
    }
  }, [documentId]);

  const handleChange = (newCode) => {
    console.log("Handling code change:", newCode);
    setCode(newCode);
    sendCodeUpdate(newCode, username, documentId, language);
  };

  const handleCursorChange = (e) => {
    const position = e.position;
    console.log("Handling cursor change:", position);
    sendCursorUpdate(position.lineNumber, position.column, username, documentId);
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    console.log("Handling language change:", newLanguage);
    setLanguage(newLanguage);
    sendCodeUpdate(code, username, documentId, newLanguage);
  };

  const handleDocumentIdSubmit = (e) => {
    e.preventDefault();
    const inputDocId = e.target.documentId.value.trim();
    if (inputDocId) {
      setDocumentId(inputDocId);
    }
  };

  if (!documentId) {
    return (
      <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
        <h2>Real-Time Collaborative Editor</h2>
        <form onSubmit={handleDocumentIdSubmit} style={{ marginTop: "20px" }}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Enter Document ID to join or create:
            </label>
            <input
              type="text"
              name="documentId"
              placeholder="Enter document ID"
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "16px",
                borderRadius: "4px",
                border: "1px solid #ccc"
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              backgroundColor: "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Join Document
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Real-Time Collaborative Editor</h2>
      
      {error && (
        <div style={{ 
          padding: "10px", 
          margin: "10px 0", 
          backgroundColor: "#ffebee", 
          color: "#c62828",
          borderRadius: "4px"
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>Language: </label>
        <select 
          value={language} 
          onChange={handleLanguageChange}
          style={{ padding: "5px" }}
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>
        <span style={{ marginLeft: "20px" }}>
          Document ID: {documentId}
        </span>
        <span style={{ marginLeft: "20px", color: isConnected ? "#4caf50" : "#f44336" }}>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <MonacoEditor
        width="100%"
        height="600"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={handleChange}
        options={{
          selectOnLineNumbers: true,
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: "on",
          automaticLayout: true
        }}
        editorDidMount={(editor) => {
          editor.onDidChangeCursorPosition(handleCursorChange);
        }}
      />

      <div style={{ marginTop: "20px" }}>
        <h3>Active Users:</h3>
        {Object.entries(cursorPositions).map(([user, position]) => (
          <div 
            key={user}
            style={{
              padding: "5px",
              margin: "5px 0",
              backgroundColor: position.color + "20",
              borderRadius: "4px"
            }}
          >
            <span style={{ color: position.color, fontWeight: "bold" }}>
              {user}
            </span>
            : Line {position.line}, Column {position.column}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

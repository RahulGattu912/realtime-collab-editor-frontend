import React, { useEffect, useState, useRef } from 'react';
import MonacoEditor from 'react-monaco-editor';
import './Editor.css';

const Editor = ({ stompClient, documentId, userId }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const editorRef = useRef(null);

  // Effect for handling WebSocket messages
  useEffect(() => {
    if (stompClient && documentId) {
      // Subscribe to document-specific topic
      const subscription = stompClient.subscribe(`/topic/document/${documentId}`, (message) => {
        try {
          const update = JSON.parse(message.body);
          console.log('Received update:', update);
          
          // Update code if provided
          if (update.content !== undefined) {
            setCode(update.content);
          }
          
          // Update language if provided
          if (update.language) {
            console.log('Setting language to:', update.language);
            setLanguage(update.language);
            // Force editor to update language
            if (editorRef.current) {
              editorRef.current.updateOptions({ language: update.language });
            }
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      // Request initial document content
      stompClient.send("/app/document/" + documentId, {}, JSON.stringify({}));

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [stompClient, documentId]);

  // Effect for handling language changes
  useEffect(() => {
    console.log('Language changed to:', language);
    if (editorRef.current) {
      editorRef.current.updateOptions({ language });
    }
  }, [language]);

  const handleLanguageChange = (newLanguage) => {
    console.log('Language change requested to:', newLanguage);
    setLanguage(newLanguage);
    if (stompClient && documentId) {
      const update = {
        documentId: documentId,
        content: code,
        language: newLanguage,
        sender: userId
      };
      console.log('Sending language update:', update);
      stompClient.send("/app/code", {}, JSON.stringify(update));
    }
  };

  const editorDidMount = (editor, monaco) => {
    console.log('Editor mounted with language:', language);
    editorRef.current = editor;
    editor.focus();
  };

  const onChange = (newValue) => {
    setCode(newValue);
    if (stompClient && documentId) {
      const update = {
        documentId: documentId,
        content: newValue,
        language: language,
        sender: userId
      };
      stompClient.send("/app/code", {}, JSON.stringify(update));
    }
  };

  const options = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
    minimap: {
      enabled: false
    },
    language: language
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <select 
          value={language} 
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="language-select"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="csharp">C#</option>
          <option value="php">PHP</option>
          <option value="ruby">Ruby</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="swift">Swift</option>
        </select>
      </div>
      <div className="editor-content">
        <MonacoEditor
          width="100%"
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          options={options}
          onChange={onChange}
          editorDidMount={editorDidMount}
        />
      </div>
    </div>
  );
};

export default Editor; 
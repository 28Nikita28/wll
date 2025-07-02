import React, { useEffect, useRef, useState } from 'react';
import './MessageInputContainer.css';

const MessageInputContainer = ({ 
  input, 
  onInputChange, 
  onSend, 
  isLoading,
  onFileUpload 
}) => {
  const textareaRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  useEffect(() => {
  const textarea = textareaRef.current;
  if (textarea) {
    textarea.style.height = 'auto';
    const maxHeight = 200;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
    setIsExpanded(newHeight >= maxHeight);
  }
}, [input]);

  return (
    <div className={`message-input-container ${isExpanded ? 'expanded' : ''}`}>
      <textarea 
        ref={textareaRef}
        id="chat-input" 
        className="message-input" 
        placeholder="Введите сообщение..."
        value={input}
        onChange={onInputChange}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        rows={2}
      />
      <div className="message-buttons">
        <button 
          className="send-button"
          onClick={onSend}
          disabled={isLoading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
          </svg>
        </button>
        <label htmlFor="file-upload" className="file-upload-button">
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                onFileUpload(file);
              }
            }}
          />
          <span>📷</span>
        </label>
      </div>
    </div>
  );
};

export default MessageInputContainer;
import React, { useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { motion } from 'framer-motion';
import { LLM_MODELS } from '../App';

const AIMessage = ({ content, modelId, isStreaming = false }) => {
  const model = LLM_MODELS.find(m => m.modelId === modelId) || {};
  
  const renderCodeBlock = useCallback(({ inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    
    return !inline && match ? (
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }, []);

  return (
    <motion.div
      className="ai-message"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="message-header">
        <div className="model-badge">
          <img 
            src={`/models/${model.id}.png`} 
            alt={model.name}
            className="model-icon"
          />
          <span>{model.name}</span>
        </div>
      </div>
      
      <div className={`message-content ${isStreaming ? 'streaming' : ''}`}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code: renderCodeBlock,
            img: ({ src, alt }) => (
              <img 
                src={src} 
                alt={alt} 
                className="message-image"
                loading="lazy"
              />
            ),
            table: ({ children }) => (
              <div className="table-container">
                <table>{children}</table>
              </div>
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      
      {isStreaming && (
        <div className="streaming-indicator">
          <div className="typing-animation">
            <div className="dot" />
            <div className="dot" />
            <div className="dot" />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(AIMessage);
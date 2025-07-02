import React from 'react';
import { motion } from 'framer-motion';

const UserMessage = ({ content, imageUrl }) => {
  return (
    <motion.div
      className="user-message"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="message-header">
        <div className="user-badge">
          <span>Вы</span>
        </div>
      </div>
      
      <div className="message-content">
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt="Uploaded content" 
            className="message-image"
          />
        )}
        <div className="message-text">
          {content.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(UserMessage);
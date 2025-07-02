import React, { forwardRef } from 'react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDropDown, Add, Brightness4, Brightness7, MoreVert } from '@mui/icons-material';

const SessionItem = ({ session, isActive, onClick, onDelete }) => {
  const lastMessage = session.messages[session.messages.length - 1];
  const model = LLM_MODELS.find(m => m.modelId === session.model);
  
  // Форматируем дату последнего сообщения
  const lastMessageTime = useMemo(() => {
    if (!lastMessage?.timestamp) return '';
    
    const date = new Date(lastMessage.timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, [lastMessage]);

  return (
    <div 
      className={`session-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {/* Иконка модели слева */}
      <div className="session-icon">
        <img 
          src={`/models/${model.id}.png`} 
          alt={model.name}
          className="model-icon-sm"
        />
      </div>
      
      {/* Текст сообщения - занимает все доступное пространство */}
      <div className="session-preview">
        {lastMessage?.content?.substring(0, 70) || "Новый чат"}
        {lastMessage?.content?.length > 70 ? '...' : ''}
      </div>
      
      {/* Мета-информация справа */}
      <div className="session-meta">
        {lastMessageTime && (
          <span className="message-time">{lastMessageTime}</span>
        )}
        <button 
          className="delete-session"
          onClick={onDelete}
        >
          <MoreVert fontSize="small" />
        </button>
      </div>
    </div>
  );
};

const LLM_MODELS = [
  {
    id: 'deepseek',
    icon: '/models/deepseek.png',
    name: "DeepSeek",
    modelId: 'deepseek',
    color: '#4D8EFF'
  },
  {
    id: 'deepseek-r1',
    icon: '/models/deepseek-r1-free.png',
    name: "DeepSeek-r1",
    modelId: 'deepseek-r1',
    color: '#FF6B6B'
  },
  {
    id: 'deepseek-v3',
    icon: '/models/deepseek.png',
    name: "DeepSeek-v3",
    modelId: 'deepseek-v3',
    color: '#99FF6B'
  },
  {
    id: 'gemini',
    icon: '/models/gemini.png',
    name: "Gemini",
    modelId: 'gemini',
    color: '#D9534F'
  },
  {
    id: "gemma",
    icon: '/models/gemma.png',
    name: "Gemma",
    modelId: "gemma",
    color: '#FF6B6B'
  },
  {
    id: 'qwen',
    icon: '/models/qwen.png',
    name: "Qwen 2.5",
    modelId: "qwen 2.5",
    color: '#7DFF6B'
  },
  {
    id: 'llama-4-maverick',
    name: "Llama-4-Maverick",
    modelId: 'llama-4-maverick',
    color: '#99FF6B'
  },
  {
    id: "llama-4-scout",
    name: "Llama-4-Scout",
    modelId: "llama-4-scout",
    color: '#1DFF6B'
  },
  {
    id: "deepseek-r1-free",
    name: "DeepSeek-r1-free",
    modelId: '"deepseek-r1-free"',
    color: '#99FF6B'
  },
  {
    id: "qwen3 235b",
    name: "Qwen-3 235b",
    modelId: "qwen3 235b",
    color: '#7F52FF'
  },
];

export const Sidebar = forwardRef(({
  isPanelOpen,
  setIsPanelOpen,
  selectedModel,
  setSelectedModel,
  chats,
  setChats,
  activeSession,
  setActiveSession,
  themeMode,
  setThemeMode,
}, ref) => {
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  const createNewSession = () => {
    const sessionId = `session-${Date.now()}`;
    const newChats = {
      ...chats,
      [sessionId]: {
        messages: [],
        model: selectedModel
      }
    };
    setChats(newChats);
    localStorage.setItem('chatSessions', JSON.stringify(newChats));
    setActiveSession(sessionId);
    setIsPanelOpen(true);
  };

  const ThemeToggleButton = () => {
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
    const themeOptions = [
      { id: 0, name: 'Светлая', icon: <Brightness7 fontSize="small" /> },
      { id: 1, name: 'Тёмная', icon: <Brightness4 fontSize="small" /> },
      { id: 2, name: 'Системная', icon: <Brightness4 fontSize="small" /> }
    ];

    const currentThemeMode = themeMode;
    const getCurrentThemeName = () => {
      return themeOptions.find(opt => opt.id === currentThemeMode)?.name || 'Тема';
    };

    return (
      <div className="theme-selector">
        <motion.button
          className="theme-button"
          onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={getCurrentThemeName()}
        >
          {themeOptions[currentThemeMode]?.icon}
        </motion.button>

        <AnimatePresence>
          {isThemeMenuOpen && (
            <motion.div
              className="theme-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {themeOptions.map(option => (
                <motion.div
                  key={option.id}
                  className="theme-option"
                  onClick={() => {
                    setThemeMode(option.id);
                    setIsThemeMenuOpen(false);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option.icon}
                  <span>{option.name}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const ModelSelector = () => {
    const currentModel = LLM_MODELS.find(m => m.modelId === selectedModel);
    
    return (
      <div className="model-selector">
        <motion.button
          className="model-button"
          onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title={currentModel?.name}
        >
          <div className="model-button-content">
            <div className="model-color" style={{ backgroundColor: currentModel?.color }} />
            <span className="model-name">{currentModel?.name}</span>
            <ArrowDropDown className="dropdown-icon" />
          </div>
        </motion.button>

        <AnimatePresence>
          {isModelMenuOpen && (
            <motion.div
              className="model-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="model-menu-header">
                <h4>Выберите модель</h4>
              </div>
              <div 
                className="model-options-list"
                style={{ 
                  maxHeight: '300px',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin'
                }}
              >
                {LLM_MODELS.map(model => (
                  <motion.div
                    key={model.id}
                    className={`model-option ${selectedModel === model.modelId ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedModel(model.modelId);
                      setIsModelMenuOpen(false);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="model-color" style={{ backgroundColor: model.color }} />
                    <div className="model-info">
                      <span className="model-name">{model.name}</span>
                      <span className="model-desc">{model.description}</span>
                    </div>
                    {selectedModel === model.modelId && (
                      <div className="selected-indicator">✓</div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div ref={ref} className={`sidebar ${isPanelOpen ? '' : 'hidden'}`}>
      {/* УДАЛЯЕМ ДУБЛИРОВАННЫЙ БЛОК КНОПОК */}
      {/* Оставляем только один блок header-controls */}
      <div className="sidebar-header">
        <div className="header-controls">
          <ModelSelector />
          <ThemeToggleButton />
          <motion.button 
            className="model-button"
            onClick={createNewSession}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Новый чат"
          >
            <Add />
          </motion.button>
        </div>
      </div>


      <div className="sidebar-content">
        <div className="sessions-list">
          {Object.keys(chats).reverse().map(sessionId => {
            const session = chats[sessionId];
            return (
              <div 
                key={sessionId}
                className={`session-item-container ${activeSession === sessionId ? 'active' : ''}`}
                onClick={() => setActiveSession(sessionId)}
              >
                <SessionItem 
                  session={session} 
                  isActive={activeSession === sessionId}
                  onDelete={(e) => {
                    e.stopPropagation();
                    const newChats = { ...chats };
                    delete newChats[sessionId];
                    setChats(newChats);
                    if (activeSession === sessionId) setActiveSession(null);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

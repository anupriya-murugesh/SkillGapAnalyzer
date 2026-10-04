import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`px-6 py-4 rounded-xl shadow-2xl font-bold flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto border ${
              toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
              toast.type === 'info' ? 'bg-gray-900 text-white border-gray-700' :
              'bg-gray-900 text-white border-gray-700'
            }`}
          >
            {toast.type === 'success' && <span className="text-green-400 text-xl">✓</span>}
            {toast.type === 'error' && <span className="text-red-500 text-xl">✗</span>}
            {toast.type === 'info' && <span className="text-blue-400 text-xl">ℹ️</span>}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((title, msg, icon = '✓') => {
    const id = Date.now();
    setToasts(t => [...t, { id, title, msg, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5">
        {toasts.map(t => (
          <div key={t.id} className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#16A34A] rounded-xl px-[18px] py-3.5 shadow-xl flex items-center gap-3 min-w-[300px] max-w-[400px] animate-[slideIn_.3s_ease]">
            <div className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center text-base flex-shrink-0">
              {t.icon}
            </div>
            <div>
              <div className="font-semibold text-sm text-[#1E293B]">{t.title}</div>
              <div className="text-[13px] text-[#64748B]">{t.msg}</div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

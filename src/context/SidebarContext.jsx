import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext({
  isCollapsed: false,
  toggleSidebar: () => {},
  setIsCollapsed: () => {}
});

const STORAGE_KEY = 'rentra_sidebar_collapsed';

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsedState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  const setIsCollapsed = (value) => {
    setIsCollapsedState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

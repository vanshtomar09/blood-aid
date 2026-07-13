"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  committedSearchQuery: string;
  setCommittedSearchQuery: (query: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [committedSearchQuery, setCommittedSearchQuery] = useState('');

  return (
    <SearchContext.Provider value={{ committedSearchQuery, setCommittedSearchQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

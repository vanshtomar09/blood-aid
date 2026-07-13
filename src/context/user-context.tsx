"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import type { UserType } from '@/components/app-layout';

interface UserContextType {
  userType: UserType;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children, userType }: { children: ReactNode, userType: UserType }) {
  return (
    <UserContext.Provider value={{ userType }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

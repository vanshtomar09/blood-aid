'use client';

import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import Header from '@/components/header';
import { SearchProvider } from '@/context/search-context';
import { UserProvider } from '@/context/user-context';
import { LocationProvider } from '@/context/location-context';
import MedicalChatbot from './medical-chatbot';

export type UserType = 'public' | 'staff';

interface AppLayoutProps {
  children: React.ReactNode;
  userType: UserType;
}

export default function AppLayout({ children, userType }: AppLayoutProps) {
  return (
    <SearchProvider>
      <UserProvider userType={userType}>
        <SidebarProvider>
            <LocationProvider>
              <div className="flex min-h-screen">
                <AppSidebar />
                <div className="flex-1 flex flex-col">
                  <Header />
                  <main className="flex-grow p-4 sm:p-6 lg:p-8 bg-background">
                    {children}
                  </main>
                </div>
                <MedicalChatbot />
              </div>
            </LocationProvider>
        </SidebarProvider>
      </UserProvider>
    </SearchProvider>
  );
}

import AppLayout from '@/components/app-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Results | BloodAid',
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout userType='public'>{children}</AppLayout>;
}
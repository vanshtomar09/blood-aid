import AppLayout from '@/components/app-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | BloodAid',
  description: 'Welcome to your BloodAid dashboard. Find blood, manage donations, and get help.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout userType='public'>{children}</AppLayout>;
}
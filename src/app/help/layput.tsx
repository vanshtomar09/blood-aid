import AppLayout from '@/components/app-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help & Support | BloodAid',
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout can be used for both user types, so we check the path
  // In a real app, you'd likely have better role-based routing
  return <AppLayout userType='public'>{children}</AppLayout>;
}
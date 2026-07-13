import AppLayout from '@/components/app-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Request Blood | BloodAid',
};

export default function RequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout userType='public'>{children}</AppLayout>;
}
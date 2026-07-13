import AppLayout from '@/components/app-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | BloodAid',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout userType='staff'>{children}</AppLayout>;
}

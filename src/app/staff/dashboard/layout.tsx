import AppLayout from '@/components/app-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Staff Dashboard | BloodAid',
};

export default function StaffDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout userType='staff'>{children}</AppLayout>;
}

import AppLayout from '@/components/app-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Map | BloodAid',
};

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout userType='public'>{children}</AppLayout>;
}

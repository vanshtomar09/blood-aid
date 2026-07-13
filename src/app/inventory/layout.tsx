import AppLayout from '@/components/app-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inventory | BloodAid',
};

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout userType='staff'>{children}</AppLayout>;
}

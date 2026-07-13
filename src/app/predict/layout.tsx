import AppLayout from '@/components/app-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demand Prediction | BloodAid',
};

export default function PredictLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout userType='staff'>{children}</AppLayout>;
}

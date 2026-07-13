import AppLayout from '@/components/app-layout';

export default function BankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout userType='public'>{children}</AppLayout>;
}
import { getBloodBanks } from "@/lib/blood-banks";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import BloodBankDetailsCard from "@/components/blood-bank-details-card";

type BankDetailsPageProps = {
    params: {
        id: string;
    }
}

export async function generateMetadata({ params }: BankDetailsPageProps) {
  const bloodBanks = await getBloodBanks();
  const bank = bloodBanks.find((b) => b.id === params.id);

  if (!bank) {
    return {
      title: "Bank Not Found | BloodAid",
    };
  }

  return {
    title: `${bank.name} | BloodAid`,
  };
}

export default async function BankDetailsPage({ params }: BankDetailsPageProps) {
  const bloodBanks = await getBloodBanks();
  const bank = bloodBanks.find((b) => b.id === params.id);

  if (!bank) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{bank.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <BloodBankDetailsCard bank={bank} />
      
    </div>
  );
}

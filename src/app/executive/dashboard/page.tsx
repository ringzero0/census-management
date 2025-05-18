
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ExecutiveCensusDataTable } from "@/components/executive/executive-census-data-table";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/contexts/auth-context";

export default function ExecutiveDashboardPage() {
  const { user, censusData } = useAuth();
  
  const executiveEntries = censusData.filter(entry => entry.submittedByEmail === user?.email);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Your Census Entries" 
          description="Manage your submitted census data or add new entries." 
        />
        <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
          <Link href="/executive/census-entry/new">
            <PlusCircle className="mr-2 h-5 w-5" /> New Census Entry
          </Link>
        </Button>
      </div>
      <ExecutiveCensusDataTable data={executiveEntries} />
    </div>
  );
}


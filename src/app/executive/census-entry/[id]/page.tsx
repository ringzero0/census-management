
"use client";

import { CensusEntryForm } from "@/components/executive/census-entry-form";
import { useAuth } from "@/contexts/auth-context";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CensusEntry } from "@/lib/schemas"; 
import type { AppUser } from "@/contexts/auth-context"; 
import { PageHeader } from "@/components/shared/page-header";

export default function EditCensusEntryPage() {
  const params = useParams();
  const router = useRouter();
  const { getCensusEntryById, user, authLoading } = useAuth(); 
  const [entry, setEntry] = useState<CensusEntry | null | undefined>(undefined);
  const [pageSpecificLoading, setPageSpecificLoading] = useState(true); 

  const id = typeof params.id === 'string' ? params.id : undefined;
  const appUser = user as AppUser | null;

  useEffect(() => {
    if (authLoading) { 
      setPageSpecificLoading(true);
      return;
    }
    setPageSpecificLoading(true);

    if (!id) {
      router.push('/executive/dashboard'); 
      setPageSpecificLoading(false);
      return;
    }
    if (!appUser || appUser.role !== 'executive') {
        router.push('/');
        setPageSpecificLoading(false);
        return;
    }

    const fetchedEntry = getCensusEntryById(id); 
    
    if (fetchedEntry && fetchedEntry.submittedByUid === appUser.uid) { 
      setEntry(fetchedEntry);
    } else if (fetchedEntry) { 
      alert("You do not have permission to edit this entry, or the entry could not be loaded correctly.");
      router.push('/executive/dashboard');
      setEntry(null); 
    }
    else {
      setEntry(null); 
    }
    setPageSpecificLoading(false);
  }, [id, getCensusEntryById, router, appUser, authLoading]);

  if (authLoading || pageSpecificLoading) {
    return <div className="flex h-screen items-center justify-center"><PageHeader title="Loading Entry..." description="Please wait while we fetch the details." /></div>;
  }

  if (entry === null) {
    return <div className="flex h-screen items-center justify-center"><PageHeader title="Entry Not Found" description="The requested census entry could not be found or you don't have permission to edit it." /></div>;
  }
  
  if (!entry) { 
    return <div className="flex h-screen items-center justify-center"><PageHeader title="Error" description="An unexpected error occurred loading the entry." /></div>;
  }

  return <CensusEntryForm entry={entry} />;
}

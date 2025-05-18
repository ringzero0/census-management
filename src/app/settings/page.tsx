
"use client";

import { UpdateProfileForm } from "@/components/shared/update-profile-form";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton"; 

export default function SettingsPage() {
  const { user, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/"); 
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="space-y-6 p-4 md:p-8">
        <PageHeader title="Loading Settings..." description="Please wait while we fetch your information." />
        <div className="w-full max-w-lg mx-auto space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <PageHeader title="User Settings" description="Manage your account details and preferences." />
      <UpdateProfileForm currentUser={user} />
    </div>
  );
}

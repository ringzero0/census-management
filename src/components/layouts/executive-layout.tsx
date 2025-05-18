
"use client";

import type { ReactNode } from 'react';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building, LogOut, UserCircle, Bell, Settings } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge'; 

export default function ExecutiveLayout({ children }: { children: ReactNode }) {
  const { user, logout, authLoading } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) { 
      if (!user) {
        router.push('/');
      } else if (user.role !== 'executive') {
        router.push(user.role === 'admin' ? '/admin/dashboard' : '/');
      }
    }
  }, [user, authLoading, router]);


  if (authLoading && !user) { 
    return <div className="flex h-screen items-center justify-center">Authenticating...</div>;
  }

  if (!user || user.role !== 'executive') {

    return <div className="flex h-screen items-center justify-center">Access Denied. Redirecting...</div>;
  }
  

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <Link href="/executive/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base text-primary">
          <Building className="h-6 w-6" />
          <span className="">CensusWise</span>
        </Link>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-initial">
             <p className="text-sm text-muted-foreground hidden sm:block">Welcome, <span className="font-semibold text-foreground">{user.name}</span> ({user.region})</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <UserCircle className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="sm:hidden">{user.region}</DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
        {children}
      </main>
    </div>
  );
}

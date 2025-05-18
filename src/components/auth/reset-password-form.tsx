
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Lock, Building } from "lucide-react";
import { z } from "zod";
import { useEffect, useState } from "react"; 

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";


const ResetPasswordFormSchema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type ResetPasswordFormValues = z.infer<typeof ResetPasswordFormSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

 useEffect(() => {
    if (!email) {
      toast({
        title: "Error",
        description: "No verified email found for password reset. Please start over.",
        variant: "destructive",
      });
      router.push("/forgot-password/request-otp");
    }
  }, [email, router, toast]);


  async function onSubmit(data: ResetPasswordFormValues) {
    if (!email) { 
       toast({ title: "Error", description: "Email is missing. Cannot reset password.", variant: "destructive" });
       return;
    }
    
    setIsSubmitting(true);
    const payload = { email, newPassword: data.password };
    const apiUrl = '/api/admin-password-reset';
    
    console.log(`ResetPasswordForm: Attempting to call API endpoint: ${apiUrl}`);
    console.log("ResetPasswordForm: Payload being sent:", JSON.stringify(payload));

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Password Update Successful",
          description: result.message || `Password for ${email} has been successfully updated. You can now login with your new password.`,
        });
        localStorage.removeItem("otpEmail");
        localStorage.removeItem("otpValue");
        localStorage.removeItem("otpTimestamp");
        router.push("/"); 
      } else {
        toast({
          title: "Password Update Failed",
          description: result.error || "Could not update password. Please try again or contact support.",
          variant: "destructive",
        });
         console.error("ResetPasswordForm: API call failed. Status:", response.status, "Response:", result);
      }
    } catch (error: any) {
      console.error("ResetPasswordForm: API call error:", error);
      toast({
        title: "Network Error",
        description: "Failed to connect to the server. Please check your internet connection and ensure the password reset service is running.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (!email) {
    
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader><CardTitle>Loading / Error</CardTitle></CardHeader>
          <CardContent><p>Verifying email for password reset...</p>
            <Button asChild className="mt-4" variant="link"><Link href="/forgot-password/request-otp">Start Over</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Building className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Reset Password</CardTitle>
          <CardDescription>Enter your new password for {email}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || form.formState.isSubmitting}>
                {isSubmitting || form.formState.isSubmitting ? "Resetting..." : "Reset Password"} <Lock className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <Link href="/" legacyBehavior>
              <a className="text-sm text-primary hover:underline">
                Back to Login
              </a>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


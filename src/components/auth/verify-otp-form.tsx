
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, CheckCircle, Repeat, Building } from "lucide-react";
import { z } from "zod";
import React, { useEffect, useState } from "react"; 
import emailjs from "@emailjs/browser";

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

const VerifyOtpFormSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be 6 digits." }).regex(/^\d+$/, { message: "OTP must be numeric." }),
});
type VerifyOtpFormValues = z.infer<typeof VerifyOtpFormSchema>;

const OTP_EXPIRY_DURATION = 5 * 60 * 1000; 

export function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  const form = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(VerifyOtpFormSchema),
    defaultValues: {
      otp: "",
    },
  });
  
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  useEffect(() => {
    if (publicKey) {
      emailjs.init(publicKey);
    } else {
      console.error("EmailJS Public Key is not defined in environment variables for VerifyOtpForm.");
    }
  }, [publicKey]);


  useEffect(() => {
    if (!email) {
      toast({ title: "Error", description: "Email not found. Please start over.", variant: "destructive" });
      router.push("/forgot-password/request-otp");
    }
  }, [email, router, toast]);

  const handleResendOtp = async () => {
    if (!email) {
      toast({ title: "Error", description: "Email not available to resend OTP.", variant: "destructive" });
      return;
    }
    setIsResending(true);
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem("otpValue", newOtp); 
    localStorage.setItem("otpTimestamp", Date.now().toString());

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;

    if (!serviceId || !templateId || !publicKey) {
      toast({
        title: "EmailJS Configuration Error",
        description: "EmailJS credentials are not fully set up.",
        variant: "destructive",
      });
      setIsResending(false);
      return;
    }

    const templateParams = {
      name: email, 
      email: email, 
      passcode: newOtp, 
    };

    try {
      await emailjs.send(serviceId, templateId, templateParams); 
      toast({ title: "OTP Resent", description: `A new OTP has been sent to ${email}.` });
    } catch (error) {
      console.error("EmailJS resend error:", error);
      toast({ title: "Failed to Resend OTP", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  async function onSubmit(data: VerifyOtpFormValues) {
    const storedEmail = localStorage.getItem("otpEmail");
    const storedOtp = localStorage.getItem("otpValue");
    const otpTimestamp = localStorage.getItem("otpTimestamp");

    if (storedEmail !== email || !storedOtp || !otpTimestamp) {
      toast({ title: "Verification Failed", description: "OTP information not found or mismatched. Please request a new OTP.", variant: "destructive" });
      router.push("/forgot-password/request-otp");
      return;
    }

    if (Date.now() - parseInt(otpTimestamp, 10) > OTP_EXPIRY_DURATION) {
      toast({ title: "OTP Expired", description: "Your OTP has expired. Please request a new one.", variant: "destructive" });
      localStorage.removeItem("otpValue"); 
      localStorage.removeItem("otpTimestamp");
      return;
    }

    if (data.otp === storedOtp) {
      toast({ title: "OTP Verified", description: "Please reset your password." });
      localStorage.removeItem("otpValue"); 
      localStorage.removeItem("otpTimestamp");
      router.push(`/reset-password?email=${encodeURIComponent(email || "")}`);
    } else {
      toast({ title: "Invalid OTP", description: "The OTP you entered is incorrect. Please try again.", variant: "destructive" });
      form.setError("otp", { type: "manual", message: "Invalid OTP."});
    }
  }

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader><CardTitle>Error</CardTitle></CardHeader>
          <CardContent><p>Email parameter is missing. Please go back and request an OTP.</p>
          <Button asChild className="mt-4"><Link href="/forgot-password/request-otp">Request OTP</Link></Button>
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
          <CardTitle className="text-3xl font-bold">Verify OTP</CardTitle>
          <CardDescription>An OTP has been sent to {email}. Please enter it below.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>One-Time Password (OTP)</FormLabel>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="Enter 6-digit OTP" {...field} className="pl-10" maxLength={6} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Verifying..." : "Verify OTP"} <CheckCircle className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </Form>
          <div className="mt-4 flex justify-between items-center">
            <Button variant="link" onClick={handleResendOtp} disabled={isResending} className="p-0 h-auto text-sm text-primary hover:underline">
              {isResending ? "Resending OTP..." : "Resend OTP"} <Repeat className="ml-1 h-4 w-4" />
            </Button>
            <Link href="/forgot-password/request-otp" legacyBehavior>
              <a className="text-sm text-primary hover:underline">
                Change Email
              </a>
            </Link>
          </div>
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

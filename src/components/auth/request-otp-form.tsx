
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Send, ShieldQuestion } from "lucide-react";
import { z } from "zod";
import React from "react"; 
import { auth } from '@/lib/firebase'; 
import { sendPasswordResetEmail } from "firebase/auth";

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

const RequestPasswordResetSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});
type RequestPasswordResetFormValues = z.infer<typeof RequestPasswordResetSchema>;

export function RequestOtpForm() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<RequestPasswordResetFormValues>({
    resolver: zodResolver(RequestPasswordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(data: RequestPasswordResetFormValues) {
    const { email } = data;
    console.log(`RequestOtpForm: Attempting to send password reset email to: ${email}`);
    // react-hook-form manages form.formState.isSubmitting automatically

    sendPasswordResetEmail(auth, email)
      .then(() => {
        console.log(`RequestOtpForm: sendPasswordResetEmail call successful for ${email}.`);
        toast({
          title: "Password Reset Email Sent",
          description: `If an account exists for ${email}, a password reset link has been sent. Please check your inbox and spam/junk folder.`,
        });
        form.reset();
      })
      .catch((error: any) => {
        console.error("RequestOtpForm: Firebase sendPasswordResetEmail error:", error.code, error.message, error);
        let friendlyMessage = "Could not send password reset email. Please try again later.";
        if (error.code === 'auth/invalid-email') {
          friendlyMessage = "The email address is not valid.";
        } else if (error.code === 'auth/network-request-failed') {
          friendlyMessage = "A network error occurred. Please check your internet connection and try again.";
        } else if (error.code === 'auth/user-not-found') {

            friendlyMessage = "No user found with this email address.";
        }
        toast({
          title: "Error Sending Reset Email",
          description: friendlyMessage,
          variant: "destructive",
        });
      });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <ShieldQuestion className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Forgot Password</CardTitle>
          <CardDescription>Enter your executive email address. If the email is registered, Firebase will send a password reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="executive.email@example.com" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Sending Link..." : "Send Password Reset Link"} <Send className="ml-2 h-5 w-5" />
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

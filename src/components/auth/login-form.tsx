
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { KeyRound, Mail, Users, Building } from "lucide-react";
import React from "react";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LoginFormSchema, type LoginFormValues } from "@/lib/schemas";
import { useAuth } from "@/contexts/auth-context";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const { login, authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      role: undefined,
    },
  });

  const selectedRole = form.watch("role");

  async function onSubmit(data: LoginFormValues) {
    const result = await login(data);
    if (result.success) {
      toast({ title: "Login Successful", description: "Redirecting to dashboard..." });
      if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/executive/dashboard");
      }
    } else {
      let description = "An unexpected error occurred. Please try again.";
      switch (result.error) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          description = "The email or password you entered is incorrect. Please double-check and try again.";
          break;
        case 'role_mismatch':
          description = "Login successful, but the selected role does not match your account's role. Please select the correct role.";
          break;
        case 'profile_not_found':
          description = "Your user profile could not be found. Please contact support.";
          break;
        case 'auth/user-disabled':
          description = "This user account has been disabled. Please contact support.";
          break;
        case 'login_failed':
        default:
          description = "Invalid credentials or role. Please try again or check if your profile is correctly set up.";
          break;
      }
      toast({
        title: "Login Failed",
        description: description,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-muted/40 p-8">
        
        <div className="sketchfab-embed-wrapper w-full h-[600px] md:h-[700px] lg:h-[800px] rounded-lg shadow-2xl overflow-hidden flex flex-col">
          <iframe
            title="Traveling Robot (Animated)"
            frameBorder="0"
            allowFullScreen

            allow="autoplay; fullscreen; xr-spatial-tracking"

            src="https://sketchfab.com/models/a433cf31672042da861e1b5b7a7a68bd/embed"
            className="w-full h-full border-0 flex-grow"
          ></iframe>
          <p style={{ fontSize: '13px', fontWeight: 'normal', margin: '5px', color: '#4A4A4A', textAlign: 'center' }}>
            <a
              href="https://sketchfab.com/3d-models/traveling-robot-animated-a433cf31672042da861e1b5b7a7a68bd?utm_medium=embed&utm_campaign=share-popup&utm_content=a433cf31672042da861e1b5b7a7a68bd"
              target="_blank"
              rel="noopener noreferrer nofollow"
              style={{ fontWeight: 'bold', color: '#1CAAD9' }}
            >
              Traveling Robot (Animated)
            </a>
            by
            <a
              href="https://sketchfab.com/BentheCreator?utm_medium=embed&utm_campaign=share-popup&utm_content=a433cf31672042da861e1b5b7a7a68bd"
              target="_blank"
              rel="noopener noreferrer nofollow"
              style={{ fontWeight: 'bold', color: '#1CAAD9' }}
            >
              Ben Shaffer
            </a>
            on
            <a
              href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=a433cf31672042da861e1b5b7a7a68bd"
              target="_blank"
              rel="noopener noreferrer nofollow"
              style={{ fontWeight: 'bold', color: '#1CAAD9' }}
            >
              Sketchfab
            </a>
          </p>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
              <Building className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">CensusWise</CardTitle>
            <CardDescription>Welcome back! Please login to your account.</CardDescription>
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
                          <Input placeholder="your.email@example.com" {...field} className="pl-10" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
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
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Login as:</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="admin" id="role-admin" />
                            <Label htmlFor="role-admin" className="font-normal">Admin</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="executive" id="role-executive" />
                            <Label htmlFor="role-executive" className="font-normal">Executive</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between">
                  {(selectedRole === "executive" || !selectedRole) && (
                    <Link href="/forgot-password/request-otp" legacyBehavior>
                      <a className="text-sm text-primary hover:underline">
                        Forgot Password?
                      </a>
                    </Link>
                  )}
                   
                  {(selectedRole === "admin") && <span />}
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={authLoading || form.formState.isSubmitting}>
                  {authLoading || form.formState.isSubmitting ? "Logging in..." : "Login"} <Users className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

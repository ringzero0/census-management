
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Mail, User, MapPin, Save } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UpdateProfileFormSchema, type UpdateProfileFormValues } from "@/lib/schemas";
import { useAuth, type AppUser } from "@/contexts/auth-context";
import { EXECUTIVE_REGIONS } from "@/lib/constants";

interface UpdateProfileFormProps {
  currentUser: AppUser;
}

export function UpdateProfileForm({ currentUser }: UpdateProfileFormProps) {
  const { updateUserProfile, authLoading } = useAuth();
  const { toast } = useToast();

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(UpdateProfileFormSchema),
    defaultValues: {
      name: currentUser.name || "",
      email: currentUser.email || "",
      region: currentUser.role === 'executive' ? currentUser.region || "" : undefined,
    },
  });

  useEffect(() => {
    form.reset({
      name: currentUser.name || "",
      email: currentUser.email || "",
      region: currentUser.role === 'executive' ? currentUser.region || "" : undefined,
    });
  }, [currentUser, form]);

  async function onSubmit(data: UpdateProfileFormValues) {
    const result = await updateUserProfile(data);
    if (result.success) {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    } else {
      toast({
        title: "Update Failed",
        description: result.error || "Could not update your profile. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {currentUser.role === "executive" && (
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Region</FormLabel>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select your region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Regions</SelectLabel>
                            {EXECUTIVE_REGIONS.map((region) => (
                              <SelectItem key={region} value={region}>
                                {region}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
              disabled={authLoading || form.formState.isSubmitting}
            >
              {authLoading || form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

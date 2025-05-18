
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Save, User, Users, BookOpen, BookX, BadgeInfo, MapPin, RotateCcw, AlertTriangle } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CensusEntrySchema, type CensusEntryFormValues, type CensusEntry } from "@/lib/schemas";
import { ID_PROOF_TYPES, TERRITORIES } from "@/lib/constants";
import { useAuth } from "@/contexts/auth-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import React from "react";


interface CensusEntryFormProps {
  entry?: CensusEntry | null; 
}

export function CensusEntryForm({ entry }: CensusEntryFormProps) {
  const { addCensusEntry, updateCensusEntry, authLoading, user } = useAuth(); 
  const router = useRouter();
  const { toast } = useToast();
  const [anomalyExplanation, setAnomalyExplanation] = React.useState<string | null>(null);

  const form = useForm<CensusEntryFormValues>({
    resolver: zodResolver(CensusEntrySchema),
    defaultValues: entry || {
      familyHeadName: "",
      numberOfDependents: 0,
      numberOfEducatedMembers: 0,
      numberOfNonEducatedMembers: 0,
      idProofType: "",
      idNumber: "",
      territory: user?.region || "", 
    },
  });

  useEffect(() => {
    if (entry) {
      console.log("CensusEntryForm: Editing entry - resetting form with entry data:", entry);
      form.reset(entry);
    } else if (user?.region) {
      console.log("CensusEntryForm: New entry - resetting form with user region:", user.region);
      form.reset({ ...form.getValues(), territory: user.region });
    } else {
      console.log("CensusEntryForm: New entry - no user region, using default form values.");
      form.reset({
        familyHeadName: "",
        numberOfDependents: 0,
        numberOfEducatedMembers: 0,
        numberOfNonEducatedMembers: 0,
        idProofType: "",
        idNumber: "",
        territory: "",
      });
    }
  }, [entry, form, user?.region]);

  async function onSubmit(data: CensusEntryFormValues) {
    console.log("CensusEntryForm: onSubmit triggered. Form data:", data);
    let result;
    if (entry?.id) {
      console.log("CensusEntryForm: Calling updateCensusEntry for ID:", entry.id);
      result = await updateCensusEntry(entry.id, data);
    } else {
      console.log("CensusEntryForm: Calling addCensusEntry.");
      result = await addCensusEntry(data);
    }
    console.log("CensusEntryForm: Operation result:", result);

    if (result.success) {
      toast({
        title: entry?.id ? "Entry Updated" : "Entry Added",
        description: `Census data for ${data.familyHeadName} has been successfully ${entry?.id ? 'updated' : 'saved'}.`,
      });
      if (result.anomalyExplanation) {
         setAnomalyExplanation(result.anomalyExplanation);
      } else {
        router.push("/executive/dashboard");
      }
    } else {
      toast({
        title: "Operation Failed",
        description: result.errorMessage || result.error || "Could not save the census entry. Please try again and check the console.",
        variant: "destructive",
      });
       console.error("CensusEntryForm: Operation Failed - Error:", result.error, "Message:", result.errorMessage);
    }
  }
  
  const handleAnomalyDialogClose = () => {
    setAnomalyExplanation(null);
    router.push("/executive/dashboard");
  }

  useEffect(() => {
    if (form.formState.errors && Object.keys(form.formState.errors).length > 0) {
      console.warn("CensusEntryForm: Form validation errors present:", form.formState.errors);
    }
  }, [form.formState.errors]);


  return (
    <>
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">{entry?.id ? "Edit Census Entry" : "New Census Entry"}</CardTitle>
        <CardDescription>
          {entry?.id ? "Update the details for this census record." : "Fill in the family details for the new census record."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="familyHeadName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Family Head Name</FormLabel>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="Full name of the family head" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfDependents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Dependents</FormLabel>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input type="number" placeholder="e.g., 3" {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfEducatedMembers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Educated Members</FormLabel>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input type="number" placeholder="e.g., 2" {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfNonEducatedMembers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Non-Educated Members</FormLabel>
                    <div className="relative">
                      <BookX className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input type="number" placeholder="e.g., 1" {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="idProofType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Proof Type</FormLabel>
                    <div className="relative">
                       <BadgeInfo className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ID_PROOF_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="idNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Number</FormLabel>
                    <div className="relative">
                      <BadgeInfo className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="Enter ID number" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="territory"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Territory / Region</FormLabel>
                     <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                        <Select onValueChange={field.onChange} value={field.value} disabled={!user || user.role !== 'admin' && !!user?.region} >
                          <FormControl>
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder="Select territory" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TERRITORIES.map((territory) => (
                              <SelectItem key={territory} value={territory}>
                                {territory}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {user && user.role === 'executive' && !user.region && <p className="text-xs text-muted-foreground mt-1">Your assigned region is not set. Please contact admin. Territory defaults to first in list if not set.</p>}
                      {user && user.role === 'executive' && user.region && <p className="text-xs text-muted-foreground mt-1">Your assigned region is: {user.region}. This field is pre-filled.</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  console.log("CensusEntryForm: Reset button clicked. Current entry:", entry, "User region:", user?.region);
                  form.reset(entry || { familyHeadName: "", numberOfDependents: 0, numberOfEducatedMembers: 0, numberOfNonEducatedMembers: 0, idProofType: "", idNumber: "", territory: user?.region || "" });
                }} 
                disabled={authLoading}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Form
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={authLoading || form.formState.isSubmitting}>
                {authLoading || form.formState.isSubmitting ? "Saving..." : (entry?.id ? "Update Entry" : "Submit Entry")} <Save className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>

    {anomalyExplanation && (
        <AlertDialog open={!!anomalyExplanation} onOpenChange={(open) => !open && handleAnomalyDialogClose()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="h-6 w-6 mr-2 text-yellow-500" /> Potential Data Anomaly Detected
              </AlertDialogTitle>
              <AlertDialogDescription className="py-4 text-base">
                {anomalyExplanation}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleAnomalyDialogClose} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Acknowledge &amp; Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}


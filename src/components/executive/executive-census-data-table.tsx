
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FilePenLine, Trash2, ArrowUpDown, CalendarIcon, SlidersHorizontal } from "lucide-react";
import { format } from 'date-fns';
import type { DateRange } from "react-day-picker";

import type { CensusEntry } from "@/lib/schemas";
import { ID_PROOF_TYPES, TERRITORIES } from "@/lib/constants";
import { useAuth } from '@/contexts/auth-context';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

interface ExecutiveCensusDataTableProps {
  data: CensusEntry[];
}

type SortKey = keyof CensusEntry | 'submissionDateFormatted';

export function ExecutiveCensusDataTable({ data }: ExecutiveCensusDataTableProps) {
  const { deleteCensusEntry, authLoading } = useAuth();
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
  const [filters, setFilters] = useState<{ territory?: string; dateRange?: DateRange; idType?: string; searchTerm?: string }>({});
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);


  const filteredAndSortedData = useMemo(() => {
    let filteredItems = data.filter(entry => {
      let matches = true;
      if (filters.territory && entry.territory !== filters.territory) matches = false;
      if (filters.idType && entry.idProofType !== filters.idType) matches = false;
      if (filters.dateRange?.from) {
        const entryDate = new Date(entry.submissionDate);
        if (entryDate < filters.dateRange.from) matches = false;
        if (filters.dateRange.to && entryDate > new Date(filters.dateRange.to.setHours(23,59,59,999))) matches = false;
      }
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        if (!entry.familyHeadName.toLowerCase().includes(term) && !entry.idNumber.toLowerCase().includes(term)) {
          matches = false;
        }
      }
      return matches;
    });

    if (sortConfig !== null) {
      filteredItems.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'submissionDateFormatted') {
          valA = new Date(a.submissionDate).getTime();
          valB = new Date(b.submissionDate).getTime();
        } else {
          valA = (a as any)[sortConfig.key];
          valB = (b as any)[sortConfig.key];
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filteredItems;
  }, [data, sortConfig, filters]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortConfig.direction === 'ascending' ? '🔼' : '🔽';
  };
  
  const handleFilterChange = (filterName: string, value: any) => {
    setFilters(prev => ({ ...prev, [filterName]: value === 'all' ? undefined : value }));
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;
    const result = await deleteCensusEntry(entryToDelete);
    if (result.success) {
      toast({ title: "Entry Deleted", description: "The census entry has been successfully deleted." });
    } else {
      toast({ title: "Deletion Failed", description: result.error || "Could not delete the entry. Please check console for details.", variant: "destructive" });
      console.error("ExecutiveCensusDataTable: Deletion failed -", result.error);
    }
    setEntryToDelete(null);
  };

  return (
    <div className="space-y-4">
      
      <div className="p-4 border rounded-lg bg-card shadow">
        <h3 className="text-lg font-semibold mb-3 flex items-center"><SlidersHorizontal className="mr-2 h-5 w-5 text-primary"/>Filter Your Entries</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search Family Head, ID..."
            value={filters.searchTerm || ""}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
          <Select value={filters.territory} onValueChange={(value) => handleFilterChange('territory', value)}>
            <SelectTrigger><SelectValue placeholder="Filter by Territory" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Territories</SelectItem>
              {TERRITORIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange?.from ? (filters.dateRange.to ? `${format(filters.dateRange.from, "LLL dd, y")} - ${format(filters.dateRange.to, "LLL dd, y")}` : format(filters.dateRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" selected={filters.dateRange} onSelect={(range) => handleFilterChange('dateRange', range)} numberOfMonths={1} />
            </PopoverContent>
          </Popover>
          <Select value={filters.idType} onValueChange={(value) => handleFilterChange('idType', value)}>
            <SelectTrigger><SelectValue placeholder="Filter by ID Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ID Types</SelectItem>
              {ID_PROOF_TYPES.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

     
      {filteredAndSortedData.length === 0 ? (
         <p className="text-center text-muted-foreground py-8">You have not submitted any census data yet, or no data matches your current filters.</p>
      ) : (
      <div className="rounded-lg border shadow-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort('familyHeadName')} className="cursor-pointer whitespace-nowrap">Family Head {getSortIndicator('familyHeadName')}</TableHead>
              <TableHead onClick={() => requestSort('numberOfDependents')} className="cursor-pointer whitespace-nowrap">Dependents {getSortIndicator('numberOfDependents')}</TableHead>
              <TableHead onClick={() => requestSort('territory')} className="cursor-pointer whitespace-nowrap">Territory {getSortIndicator('territory')}</TableHead>
              <TableHead onClick={() => requestSort('submissionDateFormatted')} className="cursor-pointer whitespace-nowrap">Date {getSortIndicator('submissionDateFormatted')}</TableHead>
              <TableHead className="whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium whitespace-nowrap">{entry.familyHeadName}</TableCell>
                <TableCell className="whitespace-nowrap">{entry.numberOfDependents}</TableCell>
                <TableCell className="whitespace-nowrap">{entry.territory}</TableCell>
                <TableCell className="whitespace-nowrap">{format(new Date(entry.submissionDate), "PP")}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Button variant="ghost" size="sm" asChild className="mr-2">
                    <Link href={`/executive/census-entry/${entry.id}`}>
                      <FilePenLine className="h-4 w-4 mr-1" /> Edit
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEntryToDelete(entry.id)} 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}
      <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the census entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEntryToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={authLoading}>
              {authLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


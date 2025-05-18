
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, SlidersHorizontal, FileText } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { ID_PROOF_TYPES, TERRITORIES } from "@/lib/constants";
import { useAuth } from '@/contexts/auth-context';

interface CensusDataFiltersProps {
  filters: {
    dateRange?: DateRange;
    executive?: string;
    territory?: string;
    idType?: string;
    searchTerm?: string;
  };
  onFilterChange: (filterName: string, value: any) => void;
  onApplyFilters: () => void;
}

export function CensusDataFilters({ filters, onFilterChange, onApplyFilters }: CensusDataFiltersProps) {
  const { executives } = useAuth();

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <SlidersHorizontal className="mr-2 h-5 w-5 text-primary" /> Filter Census Data
        </CardTitle>
        <CardDescription>Refine the census records by applying various filters.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            placeholder="Search by Family Head, ID Number..."
            value={filters.searchTerm || ""}
            onChange={(e) => onFilterChange('searchTerm', e.target.value)}
            className="lg:col-span-1"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange?.from ? (
                  filters.dateRange.to ? (
                    `${format(filters.dateRange.from, "LLL dd, y")} - ${format(filters.dateRange.to, "LLL dd, y")}`
                  ) : (
                    format(filters.dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filters.dateRange?.from}
                selected={filters.dateRange}
                onSelect={(range) => onFilterChange('dateRange', range)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
           <Select value={filters.executive} onValueChange={(value) => onFilterChange('executive', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Executive" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Executives</SelectItem>
              {executives.map(exec => (
                <SelectItem key={exec.id} value={exec.email}>{exec.name} ({exec.email})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.territory} onValueChange={(value) => onFilterChange('territory', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Territory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Territories</SelectItem>
              {TERRITORIES.map(territory => (
                <SelectItem key={territory} value={territory}>{territory}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.idType} onValueChange={(value) => onFilterChange('idType', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by ID Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ID Types</SelectItem>
              {ID_PROOF_TYPES.map(idType => (
                <SelectItem key={idType} value={idType}>{idType}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row justify-start items-center gap-4 pt-4"> {/* Changed justify-between to justify-start */}
          <Button onClick={onApplyFilters} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <FileText className="mr-2 h-4 w-4" /> Generate Report / Apply Filters
          </Button>
          
        </div>
      </CardContent>
    </Card>
  );
}

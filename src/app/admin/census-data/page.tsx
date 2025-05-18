"use client";

import React, { useState, useMemo } from 'react';
import { CensusDataFilters } from "@/components/admin/census-data-filters";
import { AdminCensusDataTable } from "@/components/admin/admin-census-data-table";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from '@/contexts/auth-context';
import type { CensusEntry } from '@/lib/schemas';
import type { DateRange } from 'react-day-picker';

interface FiltersState {
  dateRange?: DateRange;
  executive?: string;
  territory?: string;
  idType?: string;
  searchTerm?: string;
}

export default function AdminCensusDataPage() {
  const { censusData: allCensusData } = useAuth();
  const [activeFilters, setActiveFilters] = useState<FiltersState>({});
  const [appliedFilters, setAppliedFilters] = useState<FiltersState>({});

  const handleFilterChange = (filterName: string, value: any) => {
    setActiveFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(activeFilters);
  };
  
  const filteredData = useMemo(() => {
    return allCensusData.filter((entry: CensusEntry) => {
      let matches = true;
      if (appliedFilters.dateRange?.from) {
        const entryDate = new Date(entry.submissionDate);
        if (entryDate < appliedFilters.dateRange.from) matches = false;
        if (appliedFilters.dateRange.to && entryDate > new Date(appliedFilters.dateRange.to.setHours(23,59,59,999))) matches = false;
      }
      if (appliedFilters.executive && entry.submittedBy !== appliedFilters.executive) {
        matches = false;
      }
      if (appliedFilters.territory && entry.territory !== appliedFilters.territory) {
        matches = false;
      }
      if (appliedFilters.idType && entry.idProofType !== appliedFilters.idType) {
        matches = false;
      }
      if (appliedFilters.searchTerm) {
        const term = appliedFilters.searchTerm.toLowerCase();
        if (
          !entry.familyHeadName.toLowerCase().includes(term) &&
          !entry.idNumber.toLowerCase().includes(term) &&
          !entry.submittedBy.toLowerCase().includes(term)
        ) {
          matches = false;
        }
      }
      return matches;
    });
  }, [allCensusData, appliedFilters]);

  return (
    <div className="space-y-6">
      <PageHeader title="View Census Data" description="Browse, filter, and generate reports from all submitted census records." />
      <CensusDataFilters filters={activeFilters} onFilterChange={handleFilterChange} onApplyFilters={handleApplyFilters} />
      <AdminCensusDataTable data={filteredData} />
    </div>
  );
}

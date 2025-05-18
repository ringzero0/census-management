
"use client";

import React, { useState, useMemo } from 'react';
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
import { ArrowUpDown } from "lucide-react";
import type { CensusEntry } from "@/lib/schemas";
import { format } from 'date-fns';

interface AdminCensusDataTableProps {
  data: CensusEntry[];
}

type SortKey = keyof CensusEntry | 'submissionDateFormatted'; 

export function AdminCensusDataTable({ data }: AdminCensusDataTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
  
  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'submissionDateFormatted') {
          valA = new Date(a.submissionDate).getTime();
          valB = new Date(b.submissionDate).getTime();
        } else if (sortConfig.key === 'submittedByEmail') { 
          valA = a.submittedByEmail.toLowerCase();
          valB = b.submittedByEmail.toLowerCase();
        } else {
         
          valA = (a as any)[sortConfig.key];
          valB = (b as any)[sortConfig.key];
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ? '🔼' : '🔽';
  };

  if (data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No census data available matching your filters.</p>;
  }

  return (
    <div className="rounded-lg border shadow-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => requestSort('familyHeadName')} className="cursor-pointer">
              Family Head {getSortIndicator('familyHeadName')}
            </TableHead>
            <TableHead onClick={() => requestSort('numberOfDependents')} className="cursor-pointer">
              Dependents {getSortIndicator('numberOfDependents')}
            </TableHead>
            <TableHead onClick={() => requestSort('numberOfEducatedMembers')} className="cursor-pointer">
              Educated {getSortIndicator('numberOfEducatedMembers')}
            </TableHead>
            <TableHead onClick={() => requestSort('numberOfNonEducatedMembers')} className="cursor-pointer">
              Non-Educated {getSortIndicator('numberOfNonEducatedMembers')}
            </TableHead>
            <TableHead onClick={() => requestSort('idProofType')} className="cursor-pointer">
              ID Type {getSortIndicator('idProofType')}
            </TableHead>
            <TableHead onClick={() => requestSort('idNumber')} className="cursor-pointer">
              ID Number {getSortIndicator('idNumber')}
            </TableHead>
            <TableHead onClick={() => requestSort('territory')} className="cursor-pointer">
              Territory {getSortIndicator('territory')}
            </TableHead>
            <TableHead onClick={() => requestSort('submissionDateFormatted')} className="cursor-pointer">
              Date {getSortIndicator('submissionDateFormatted')}
            </TableHead>
            <TableHead onClick={() => requestSort('submittedByEmail')} className="cursor-pointer"> {/* Changed from submittedBy */}
              Submitted By {getSortIndicator('submittedByEmail')} {/* Changed from submittedBy */}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((entry) => (
            <TableRow key={entry.id}>
              <>
                <TableCell className="font-medium">{entry.familyHeadName}</TableCell>
                <TableCell>{entry.numberOfDependents}</TableCell>
                <TableCell>{entry.numberOfEducatedMembers}</TableCell>
                <TableCell>{entry.numberOfNonEducatedMembers}</TableCell>
                <TableCell>{entry.idProofType}</TableCell>
                <TableCell>{entry.idNumber}</TableCell>
                <TableCell>{entry.territory}</TableCell>
                <TableCell>{format(new Date(entry.submissionDate), "PPp")}</TableCell>
                <TableCell>{entry.submittedByEmail}</TableCell>
              </>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

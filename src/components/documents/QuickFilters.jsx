import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const documentTypeLabels = {
  all: "הכל",
  contract: "חוזים",
  invoice: "חשבוניות",
  bank_statement: "אישורי בנק",
  tax_form: "טפסי מס",
  loan: "הלוואות",
  mortgage: "משכנתאות",
  insurance: "ביטוח",
  government: "רשויות",
  receipt: "קבלות",
  certificate: "אישורים",
  other: "אחר"
};

export default function QuickFilters({ selectedType, onTypeChange }) {
  const filterTypes = Object.keys(documentTypeLabels);

  return (
    <div className="flex flex-wrap gap-2">
      {filterTypes.map((type) => (
        <Button
          key={type}
          variant={selectedType === type ? "default" : "outline"}
          size="sm"
          onClick={() => onTypeChange(type)}
          className={`
            transition-all duration-200 text-xs
            ${selectedType === type 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
              : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
            }
          `}
        >
          {documentTypeLabels[type]}
        </Button>
      ))}
    </div>
  );
}
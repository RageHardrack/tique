export type TaxCategory =
  | 'NONE'
  | 'FOURTH_CATEGORY_INCOME'
  | 'FIFTH_CATEGORY_INCOME'
  | 'DEDUCTIBLE_EXPENSE_3UIT';

export type TaxDocumentType =
  | 'NONE'
  | 'RXH'
  | 'FACTURA'
  | 'BOLETA'
  | 'PAYROLL_SLIP'
  | 'OTHER';

export type TaxDeductionType =
  | 'NONE'
  | 'RESTAURANT_BAR'
  | 'HOTEL'
  | 'RENTAL'
  | 'PROFESSIONAL_SERVICE'
  | 'DOMESTIC_WORKER';

export interface TaxProfile {
  taxProfileEnabled: boolean;
  taxCountry: string;
  taxRuc?: string | null;
}

export interface TaxBracket {
  bracketNumber: number;
  description: string;
  rate: number;
  uitRange: string;
  taxableAmount: number;
  taxAmount: number;
}

export interface TaxDeductibleItem {
  id: string;
  date: string;
  note?: string | null;
  documentType: TaxDocumentType;
  documentNumber?: string | null;
  deductionType: TaxDeductionType;
  originalAmount: number;
  deductionPercentage: number;
  deductibleAmount: number;
}

export interface TaxProjectionResult {
  year: number;
  uitValue: number;
  currency: string;
  
  // 4ta Categoría
  grossFourthCategory: number;
  fourthCategoryDeduction20: number;
  netFourthCategory: number;
  
  // 5ta Categoría
  grossFifthCategory: number;
  netFifthCategory: number;
  
  // Renta Total
  totalGrossIncome: number;
  totalNetWorkIncome: number;
  
  // Deducciones
  fixedDeduction7Uit: number;
  deductible3UitLimit: number;
  appliedDeductible3Uit: number;
  totalDeductions: number;
  
  // Base Imponible
  netTaxableIncome: number;
  
  // Tramos Progresivos
  brackets: TaxBracket[];
  totalCalculatedTax: number;
  
  // Retenciones
  fourthCategoryWithholdings: number;
  fifthCategoryWithholdings: number;
  totalWithholdings: number;
  
  // Saldo
  estimatedTaxDue: number;
  status: 'PAYMENT_DUE' | 'REFUND_DUE' | 'ZERO';
}

import type { Transaction } from '../entities/Transaction';
import type { Category } from '../entities/Category';

export interface SuggestionResult {
  categoryId: string;
  categoryName: string;
  confidence: 'HIGH' | 'MEDIUM' | 'FALLBACK';
  source: 'HISTORY' | 'KEYWORD';
}

const KEYWORD_RULES: Record<string, string[]> = {
  // Comida / Alimentación / Supermercado
  Alimentación: [
    'supermercado',
    'automercado',
    'mercado',
    'mercadona',
    'walmart',
    'tottus',
    'plazavea',
    'metro',
    'makro',
    'panaderia',
    'almuerzo',
    'cena',
    'comida',
    'restaurante',
    'mcdonalds',
    'burger',
    'pizza',
    'kfc',
    'starbucks',
    'cafeteria',
    'cafe',
  ],
  // Transporte
  Transporte: [
    'uber',
    'didi',
    'cabify',
    'taxi',
    'gasolina',
    'combustible',
    'peaje',
    'metro',
    'bus',
    'estacionamiento',
    'parking',
  ],
  // Entretenimiento / Streaming
  Entretenimiento: [
    'netflix',
    'spotify',
    'disney',
    'hbo',
    'max',
    'youtube',
    'prime video',
    'cinema',
    'cine',
    'steam',
    'playstation',
    'xbox',
    'nintendo',
  ],
  // Servicios Básicos
  Servicios: [
    'luz',
    'agua',
    'electricidad',
    'internet',
    'fibra',
    'telefono',
    'celular',
    'movistar',
    'claro',
    'entel',
    'cantv',
    'gas',
  ],
  // Salud / Farmacia
  Salud: [
    'farmacia',
    'botica',
    'medico',
    'consulta',
    'hospital',
    'clinica',
    'medicamento',
    'dentista',
    'odontologo',
    'farmatodo',
    'inkafarma',
    'mifarma',
  ],
  // Vivienda / Hogar
  Vivienda: [
    'alquiler',
    'renta',
    'condominio',
    'mantenimiento',
    'hipoteca',
    'hogar',
  ],
  // Educación
  Educación: [
    'universidad',
    'colegio',
    'curso',
    'udemy',
    'platzi',
    'libros',
    'matricula',
  ],
  // Ingresos
  Salario: [
    'nomina',
    'sueldo',
    'salario',
    'honorarios',
    'quincena',
    'pago mensual',
  ],
};

export class CategorySuggestionService {
  /**
   * Suggests the best matching category for a transaction description based on:
   * 1. Recent transaction history matching exact or fuzzy description.
   * 2. Keyword dictionary matched against available user categories.
   */
  static suggestCategory(params: {
    description: string;
    categories: Category[];
    recentTransactions?: Transaction[];
  }): SuggestionResult | null {
    const { description, categories, recentTransactions = [] } = params;
    const cleanDesc = description.trim().toLowerCase();
    if (!cleanDesc || categories.length === 0) return null;

    // 1. History match: check if identical or starting description was used before
    const categoryUsageCount: Record<string, number> = {};
    for (const tx of recentTransactions) {
      if (!tx.categoryId || !tx.note) continue;
      const txDesc = tx.note.trim().toLowerCase();
      if (txDesc === cleanDesc || txDesc.includes(cleanDesc) || cleanDesc.includes(txDesc)) {
        categoryUsageCount[tx.categoryId] = (categoryUsageCount[tx.categoryId] || 0) + 1;
      }
    }

    let bestHistCatId: string | null = null;
    let maxCount = 0;
    for (const [catId, count] of Object.entries(categoryUsageCount)) {
      if (count > maxCount) {
        maxCount = count;
        bestHistCatId = catId;
      }
    }

    if (bestHistCatId) {
      const cat = categories.find((c) => c.id === bestHistCatId);
      if (cat) {
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          confidence: 'HIGH',
          source: 'HISTORY',
        };
      }
    }

    // 2. Keyword rules match
    const words = cleanDesc.split(/\s+/);
    for (const [ruleGroup, keywords] of Object.entries(KEYWORD_RULES)) {
      const match = keywords.some((k) => {
        if (k.includes(' ')) {
          return cleanDesc.includes(k);
        }
        return words.includes(k);
      });

      if (match) {
        // Find user category that matches the rule group or category name closely
        const matchedCat = categories.find(
          (c) =>
            c.name.toLowerCase() === ruleGroup.toLowerCase() ||
            c.name.toLowerCase().includes(ruleGroup.toLowerCase()) ||
            ruleGroup.toLowerCase().includes(c.name.toLowerCase()) ||
            keywords.some((k) => c.name.toLowerCase() === k),
        );

        if (matchedCat) {
          return {
            categoryId: matchedCat.id,
            categoryName: matchedCat.name,
            confidence: 'MEDIUM',
            source: 'KEYWORD',
          };
        }
      }
    }

    return null;
  }
}

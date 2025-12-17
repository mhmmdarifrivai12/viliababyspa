import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TreatmentBase {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  category_id: string | null;
  discount_percentage: number | null;
  discount_active: boolean;
}

export function getDiscountedPrice(treatment: TreatmentBase): number {
  if (treatment.discount_active && treatment.discount_percentage && treatment.discount_percentage > 0) {
    return treatment.price - (treatment.price * treatment.discount_percentage / 100);
  }
  return treatment.price;
}

export interface Treatment extends TreatmentBase {
  category: {
    id: string;
    name: string;
    description: string | null;
    display_order: number;
  } | null;
}

export interface TreatmentCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  treatments: TreatmentBase[];
}

export function useTreatments() {
  return useQuery({
    queryKey: ["treatments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select(`
          *,
          category:treatment_categories(*)
        `)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as Treatment[];
    },
  });
}

export function useTreatmentCategories() {
  return useQuery({
    queryKey: ["treatment-categories"],
    queryFn: async () => {
      const { data: categories, error: catError } = await supabase
        .from("treatment_categories")
        .select("*")
        .order("display_order");

      if (catError) throw catError;

      const { data: treatments, error: treatError } = await supabase
        .from("treatments")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (treatError) throw treatError;

      const categoriesWithTreatments: TreatmentCategory[] = categories.map((cat) => ({
        ...cat,
        treatments: treatments.filter((t) => t.category_id === cat.id),
      }));

      return categoriesWithTreatments;
    },
  });
}

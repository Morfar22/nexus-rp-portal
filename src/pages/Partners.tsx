import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { PartnersHero } from "@/components/partners/PartnersHero";
import { PartnersGrid } from "@/components/partners/PartnersGrid";
import { PartnersEmptyState } from "@/components/partners/PartnersEmptyState";
import { PartnersLoading } from "@/components/partners/PartnersLoading";

interface Partner {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  order_index: number;
  discount_code?: string | null;
}

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
        
        <main className="container mx-auto px-4 py-12">
          <PartnersHero />

          {loading ? (
            <PartnersLoading />
          ) : partners.length > 0 ? (
            <PartnersGrid partners={partners} />
          ) : (
            <PartnersEmptyState />
          )}
        </main>
    </div>
  );
}

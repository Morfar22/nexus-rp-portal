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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gaming-dark via-gaming-darker to-gaming-dark" />
      <div className="absolute inset-0 cyber-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-gaming-dark/30 via-transparent to-gaming-dark/30" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
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
    </div>
  );
}

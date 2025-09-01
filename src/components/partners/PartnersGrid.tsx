import { PartnerCard } from "./PartnerCard";

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

interface PartnersGridProps {
  partners: Partner[];
}

export function PartnersGrid({ partners }: PartnersGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {partners.map((partner, index) => (
        <PartnerCard 
          key={partner.id} 
          partner={partner} 
          index={index}
        />
      ))}
    </div>
  );
}
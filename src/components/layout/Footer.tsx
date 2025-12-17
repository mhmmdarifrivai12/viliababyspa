import { Link } from "react-router-dom";
import { Phone, Instagram, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function Footer() {
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");
      if (error) throw error;
      
      const settingsObj: Record<string, string> = {};
      data.forEach((s) => {
        settingsObj[s.key] = s.value || "";
      });
      return settingsObj;
    },
  });

  const phone = settings?.store_phone || "6282210400961";
  const instagram = settings?.store_instagram || "viliababyspa";
  const address = settings?.store_address || "Alamat Studio";
  const mapsLink = settings?.maps_link || "";

  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-heading text-xl font-bold text-gradient">
              Vilia Baby Spa
            </h3>
            <p className="text-sm text-muted-foreground">
              Layanan Studio dan Home Care dengan tenaga profesional yang 
              bersertifikat Baby & Mom Treatment serta Manajemen Laktasi.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-heading font-semibold">Navigasi</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/layanan" className="text-muted-foreground hover:text-primary transition-colors">
                  Layanan
                </Link>
              </li>
              <li>
                <Link to="/kontak" className="text-muted-foreground hover:text-primary transition-colors">
                  Kontak
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-heading font-semibold">Kontak</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <a 
                  href={`https://wa.me/${phone}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {phone.replace("62", "0")}
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Instagram className="h-4 w-4 text-primary" />
                <a 
                  href={`https://instagram.com/${instagram}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  @{instagram}
                </a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                {mapsLink ? (
                  <a 
                    href={mapsLink}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    {address}
                  </a>
                ) : (
                  <span>{address}</span>
                )}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Vilia Baby Spa. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

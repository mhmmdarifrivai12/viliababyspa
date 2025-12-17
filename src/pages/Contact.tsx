import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Phone, 
  Instagram, 
  MapPin, 
  Clock, 
  MessageCircle,
  Home,
  Building2,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Contact() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');
      if (error) throw error;
      
      const settingsObj: Record<string, string> = {};
      data?.forEach((item) => {
        settingsObj[item.key] = item.value || '';
      });
      return settingsObj;
    }
  });

  const phone = settings?.store_phone || '6282210400961';
  const instagram = settings?.store_instagram || 'viliababyspa';
  const address = settings?.store_address || '';
  const homeCareAreas = settings?.home_care_areas || '';
  const hoursWeekday = settings?.hours_weekday || '08:00 - 17:00';
  const hoursWeekend = settings?.hours_weekend || '09:00 - 15:00';
  const mapsLink = settings?.maps_link || '';
  const certifications = settings?.certifications?.split(',').map(c => c.trim()).filter(Boolean) || ['Baby & Mom Treatment', 'Manajemen Laktasi'];

  return (
    <div className="py-12">
      {/* Header */}
      <section className="gradient-soft py-12 mb-8">
        <div className="container text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Hubungi Kami
          </Badge>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            <span className="text-gradient">Kontak & Lokasi</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Kami siap membantu Anda. Hubungi kami untuk konsultasi atau booking layanan
          </p>
        </div>
      </section>

      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            {/* WhatsApp */}
            <Card className="border-border/50 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-heading">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary-foreground" />
                  </div>
                  WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Hubungi kami via WhatsApp untuk konsultasi dan booking
                </p>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <a
                    href={`https://wa.me/${phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="gradient-primary text-primary-foreground w-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {phone.startsWith('62') ? '0' + phone.slice(2) : phone}
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Instagram */}
            <Card className="border-border/50 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-heading">
                  <div className="w-10 h-10 rounded-full gradient-mint flex items-center justify-center">
                    <Instagram className="h-5 w-5 text-accent-foreground" />
                  </div>
                  Instagram
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Follow kami untuk update terbaru dan promo
                </p>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <a
                    href={`https://instagram.com/${instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full">
                      <Instagram className="h-4 w-4 mr-2" />
                      @{instagram}
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Operating Hours */}
            <Card className="border-border/50 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-heading">
                  <div className="w-10 h-10 rounded-full bg-lavender flex items-center justify-center">
                    <Clock className="h-5 w-5 text-foreground" />
                  </div>
                  Jam Operasional
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Senin - Sabtu</span>
                      <span className="font-medium">{hoursWeekday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minggu</span>
                      <span className="font-medium">{hoursWeekend}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Location Info */}
          <div className="space-y-6">
            {/* Studio */}
            <Card className="border-border/50 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-heading">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  Lokasi Studio
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Vilia Baby Spa Studio</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        {address || 'Alamat belum diatur'}
                      </p>
                      {mapsLink && (
                        <a
                          href={mapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm inline-flex items-center gap-1 mt-2 hover:underline"
                        >
                          Lihat di Google Maps
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Home Care */}
            <Card className="border-border/50 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-heading">
                  <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center">
                    <Home className="h-5 w-5 text-foreground" />
                  </div>
                  Layanan Home Care
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Kami melayani kunjungan ke rumah untuk kenyamanan Anda dan si kecil
                </p>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Area Layanan:</p>
                    <p className="text-sm text-muted-foreground">
                      {homeCareAreas || 'Area layanan belum diatur'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card className="border-border/50 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg font-heading">
                  Sertifikasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-28" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {certifications.map((cert, index) => (
                      <Badge key={index} variant="secondary">{cert}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12">
          <Card className="gradient-primary border-0">
            <CardContent className="py-8 text-center">
              <h3 className="text-xl font-heading font-bold text-primary-foreground mb-2">
                Siap untuk Booking?
              </h3>
              <p className="text-primary-foreground/80 mb-4">
                Hubungi kami sekarang untuk mendapatkan jadwal terbaik
              </p>
              <a
                href={`https://wa.me/${phone}?text=Halo,%20saya%20ingin%20booking%20layanan%20Vilia%20Baby%20Spa`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="lg">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Booking Sekarang
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Baby, 
  Heart, 
  Home, 
  Award, 
  MessageCircle,
  Star,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TestimonialForm } from "@/components/testimonials/TestimonialForm";

const features = [
  {
    icon: Baby,
    title: "Baby Treatment",
    description: "Perawatan lengkap untuk tumbuh kembang bayi yang optimal",
  },
  {
    icon: Heart,
    title: "Mom Treatment",
    description: "Pijat relaksasi dan pemulihan untuk ibu hamil & nifas",
  },
  {
    icon: Home,
    title: "Home Care",
    description: "Layanan ke rumah untuk kenyamanan Anda dan si kecil",
  },
  {
    icon: Award,
    title: "Bersertifikat",
    description: "Tenaga profesional bersertifikat Baby & Mom Treatment",
  },
];

interface Testimonial {
  id: string;
  customer_name: string;
  description: string;
  rating: number;
  image_url: string | null;
}

export default function Index() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("id, customer_name, description, rating, image_url")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (data) setTestimonials(data);
    };

    fetchTestimonials();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-soft py-20 lg:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-mint/30 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="animate-fade-in">
              <Sparkles className="h-3 w-3 mr-1" />
              Studio & Home Care
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold animate-fade-in-up">
              <span className="text-gradient">Vilia Baby Spa</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Layanan perawatan bayi, anak, dan ibu dengan sentuhan lembut 
              dari tenaga profesional bersertifikat
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <a 
                href="https://wa.me/6282210400961?text=Halo,%20saya%20ingin%20booking%20layanan%20Vilia%20Baby%20Spa"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="gradient-primary text-primary-foreground shadow-soft">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Booking via WhatsApp
                </Button>
              </a>
              <Link to="/layanan">
                <Button size="lg" variant="outline">
                  Lihat Layanan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">
              Mengapa Memilih Kami?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Vilia Baby Spa menyediakan layanan terbaik dengan tenaga ahli 
              yang berpengalaman dan bersertifikat
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="border-border/50 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">
              Layanan Kami
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Berbagai pilihan treatment untuk bayi, anak, dan ibu
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              "Baby Treatment",
              "Kids Treatment", 
              "Mom/Nifas Treatment",
              "Pijat Laktasi",
              "Pregnancy",
              "Baby Spa",
              "Haircut & Tindik",
              "Newborn Care"
            ].map((service, index) => (
              <Card 
                key={service}
                className="border-border/50 hover:border-primary/50 transition-all animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardContent className="p-4 text-center">
                  <p className="font-medium text-sm">{service}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link to="/layanan">
              <Button variant="outline" size="lg">
                Lihat Semua Layanan & Harga
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">
              Kata Mereka
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Testimoni dari para bunda yang sudah merasakan layanan kami
            </p>
          </div>
          
          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {testimonials.map((testimonial, index) => (
                <Card 
                  key={testimonial.id}
                  className="border-border/50 shadow-soft animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    {testimonial.image_url && (
                      <img 
                        src={testimonial.image_url} 
                        alt={testimonial.customer_name}
                        className="w-full h-40 object-cover rounded-lg mb-4"
                      />
                    )}
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${
                            i < testimonial.rating 
                              ? "fill-warning text-warning" 
                              : "text-muted-foreground"
                          }`} 
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic line-clamp-3">
                      "{testimonial.description}"
                    </p>
                    <p className="font-semibold text-sm">{testimonial.customer_name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center mb-12">
              <p className="text-muted-foreground">Belum ada testimoni. Jadilah yang pertama!</p>
            </div>
          )}

          {/* Testimonial Form */}
          <div className="max-w-lg mx-auto">
            <TestimonialForm />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary">
        <div className="container text-center">
          <h2 className="text-3xl font-heading font-bold text-primary-foreground mb-4">
            Siap untuk Booking?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Hubungi kami via WhatsApp untuk konsultasi gratis dan booking layanan
          </p>
          <a 
            href="https://wa.me/6282210400961?text=Halo,%20saya%20ingin%20bertanya%20tentang%20layanan%20Vilia%20Baby%20Spa"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" variant="secondary" className="shadow-lg">
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat Sekarang
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Sparkles, Percent } from "lucide-react";
import { useTreatmentCategories, getDiscountedPrice } from "@/hooks/useTreatments";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function Services() {
  const { data: categories, isLoading } = useTreatmentCategories();
  const [activeTab, setActiveTab] = useState<string>("");

  // Set default tab when data loads
  if (categories && categories.length > 0 && !activeTab) {
    setActiveTab(categories[0].id);
  }

  return (
    <div className="py-12">
      {/* Header */}
      <section className="gradient-soft py-12 mb-8">
        <div className="container text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Price List
          </Badge>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            <span className="text-gradient">Layanan & Harga</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Berbagai pilihan treatment untuk bayi, anak, dan ibu dengan harga terjangkau
          </p>
        </div>
      </section>

      <div className="container">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          </div>
        ) : categories && categories.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex-wrap h-auto gap-2 bg-muted/50 p-2 mb-8">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id}>
                <div className="mb-6">
                  <h2 className="text-2xl font-heading font-bold mb-2">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-muted-foreground">{category.description}</p>
                  )}
                </div>

                {category.treatments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.treatments.map((treatment, index) => (
                      <Card
                        key={treatment.id}
                        className="border-border/50 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1 animate-fade-in relative overflow-hidden"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {treatment.discount_active && treatment.discount_percentage && treatment.discount_percentage > 0 && (
                          <div className="absolute top-2 right-2 z-10">
                            <Badge className="bg-red-500 text-white flex items-center gap-1">
                              <Percent className="h-3 w-3" />
                              {treatment.discount_percentage}% OFF
                            </Badge>
                          </div>
                        )}
                        {treatment.image_url && (
                          <div className="aspect-video overflow-hidden rounded-t-lg">
                            <img
                              src={treatment.image_url}
                              alt={treatment.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-heading">
                            {treatment.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {treatment.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {treatment.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div>
                              {treatment.discount_active && treatment.discount_percentage && treatment.discount_percentage > 0 ? (
                                <>
                                  <span className="text-sm line-through text-muted-foreground">
                                    {formatPrice(treatment.price)}
                                  </span>
                                  <span className="text-xl font-bold text-primary block">
                                    {formatPrice(getDiscountedPrice(treatment))}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xl font-bold text-primary">
                                  {formatPrice(treatment.price)}
                                </span>
                              )}
                            </div>
                            <a
                              href={`https://wa.me/6282210400961?text=Halo,%20saya%20ingin%20booking%20${encodeURIComponent(treatment.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" className="gradient-primary text-primary-foreground">
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Book
                              </Button>
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Belum ada treatment di kategori ini
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              Belum ada data layanan
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <Card className="gradient-mint border-0">
            <CardContent className="py-8">
              <h3 className="text-xl font-heading font-bold mb-2">
                Butuh Konsultasi?
              </h3>
              <p className="text-muted-foreground mb-4">
                Hubungi kami untuk konsultasi gratis dan rekomendasi treatment yang sesuai
              </p>
              <a
                href="https://wa.me/6282210400961?text=Halo,%20saya%20ingin%20konsultasi%20mengenai%20layanan%20Vilia%20Baby%20Spa"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="gradient-primary text-primary-foreground">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat WhatsApp
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

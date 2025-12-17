import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Trash2, Star, Loader2, Image as ImageIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Testimonial {
  id: string;
  customer_name: string;
  description: string;
  rating: number;
  image_url: string | null;
  is_approved: boolean;
  created_at: string;
}

export default function TestimonialManagement() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast.error("Gagal memuat testimoni");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleApprove = async (id: string, approve: boolean) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from("testimonials")
        .update({ is_approved: approve })
        .eq("id", id);

      if (error) throw error;

      toast.success(approve ? "Testimoni disetujui" : "Testimoni ditolak");
      fetchTestimonials();
    } catch (error) {
      console.error("Error updating testimonial:", error);
      toast.error("Gagal mengupdate testimoni");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string, imageUrl: string | null) => {
    setProcessingId(id);
    try {
      // Delete image from storage if exists
      if (imageUrl) {
        const fileName = imageUrl.split("/").pop();
        if (fileName) {
          await supabase.storage.from("testimonial-images").remove([fileName]);
        }
      }

      const { error } = await supabase.from("testimonials").delete().eq("id", id);

      if (error) throw error;

      toast.success("Testimoni berhasil dihapus");
      fetchTestimonials();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Gagal menghapus testimoni");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingTestimonials = testimonials.filter((t) => !t.is_approved);
  const approvedTestimonials = testimonials.filter((t) => t.is_approved);

  const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {testimonial.image_url && (
            <img
              src={testimonial.image_url}
              alt={testimonial.customer_name}
              className="w-full sm:w-20 h-32 sm:h-20 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h4 className="font-semibold">{testimonial.customer_name}</h4>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < testimonial.rating
                          ? "fill-warning text-warning"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Badge variant={testimonial.is_approved ? "default" : "secondary"}>
                {testimonial.is_approved ? "Disetujui" : "Menunggu"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {testimonial.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {!testimonial.is_approved && (
                <Button
                  size="sm"
                  onClick={() => handleApprove(testimonial.id, true)}
                  disabled={processingId === testimonial.id}
                >
                  {processingId === testimonial.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Setujui
                    </>
                  )}
                </Button>
              )}
              {testimonial.is_approved && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApprove(testimonial.id, false)}
                  disabled={processingId === testimonial.id}
                >
                  <X className="h-4 w-4 mr-1" />
                  Batalkan
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={processingId === testimonial.id}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Hapus
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Testimoni?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini tidak dapat dibatalkan. Testimoni akan dihapus secara permanen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(testimonial.id, testimonial.image_url)}
                    >
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">Manajemen Testimoni</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Kelola testimoni dari pelanggan
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="text-xs sm:text-sm">
            Menunggu ({pendingTestimonials.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-xs sm:text-sm">
            Disetujui ({approvedTestimonials.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pendingTestimonials.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Tidak ada testimoni menunggu</p>
              </CardContent>
            </Card>
          ) : (
            pendingTestimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-4">
          {approvedTestimonials.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Belum ada testimoni disetujui</p>
              </CardContent>
            </Card>
          ) : (
            approvedTestimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

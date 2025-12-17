import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, Upload, X, Image } from "lucide-react";
import { MultiSelectAreas, areasToString, stringToAreas } from "@/components/ui/multi-select-areas";

export default function SiteSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");
      if (error) throw error;
      
      // Convert to object
      const settingsObj: Record<string, string> = {};
      data.forEach((s) => {
        settingsObj[s.key] = s.value || "";
      });
      return settingsObj;
    },
  });

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  // Initialize form data when settings load
  useEffect(() => {
    if (settings && Object.keys(formData).length === 0) {
      setFormData(settings);
      setSelectedAreas(stringToAreas(settings.home_care_areas || ""));
    }
  }, [settings]);

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleAreasChange = (areas: string[]) => {
    setSelectedAreas(areas);
    updateField("home_care_areas", areasToString(areas));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "File harus berupa gambar",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Ukuran file maksimal 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (formData.store_logo) {
        const oldPath = formData.store_logo.split("/").pop();
        if (oldPath) {
          await supabase.storage.from("store-assets").remove([oldPath]);
        }
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from("store-assets")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("store-assets")
        .getPublicUrl(fileName);

      updateField("store_logo", publicUrl);

      toast({
        title: "Berhasil",
        description: "Logo berhasil diupload",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (formData.store_logo) {
      try {
        const fileName = formData.store_logo.split("/").pop();
        if (fileName) {
          await supabase.storage.from("store-assets").remove([fileName]);
        }
        updateField("store_logo", "");
        toast({
          title: "Berhasil",
          description: "Logo berhasil dihapus",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(formData)) {
        const { error } = await supabase
          .from("site_settings")
          .upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }
      
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({
        title: "Berhasil",
        description: "Pengaturan berhasil disimpan",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Pengaturan</h1>
          <p className="text-muted-foreground">
            Kelola informasi website
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Simpan
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Logo Section */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Logo Toko
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-6">
              {/* Logo Preview */}
              <div className="flex-shrink-0">
                {formData.store_logo ? (
                  <div className="relative">
                    <img
                      src={formData.store_logo}
                      alt="Logo Toko"
                      className="w-32 h-32 object-contain rounded-lg border border-border bg-background"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={handleRemoveLogo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Upload Section */}
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-medium">Upload Logo</p>
                  <p className="text-xs text-muted-foreground">
                    Format: JPG, PNG, WebP. Maksimal 2MB. Rekomendasi: 200x200px
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Pilih Gambar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Informasi Toko</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Toko</Label>
              <Input
                value={formData.store_name || ""}
                onChange={(e) => updateField("store_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={formData.store_description || ""}
                onChange={(e) => updateField("store_description", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Sertifikasi</Label>
              <Input
                value={formData.certifications || ""}
                onChange={(e) => updateField("certifications", e.target.value)}
                placeholder="Pisahkan dengan koma"
              />
            </div>
          </CardContent>
        </Card>

        {/* Jam Operasional */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Jam Operasional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Senin - Jumat</Label>
                <Input
                  value={formData.hours_weekday || ""}
                  onChange={(e) => updateField("hours_weekday", e.target.value)}
                  placeholder="08:00 - 17:00"
                />
              </div>
              <div className="space-y-2">
                <Label>Sabtu - Minggu</Label>
                <Input
                  value={formData.hours_weekend || ""}
                  onChange={(e) => updateField("hours_weekend", e.target.value)}
                  placeholder="09:00 - 15:00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan Khusus</Label>
              <Input
                value={formData.hours_note || ""}
                onChange={(e) => updateField("hours_note", e.target.value)}
                placeholder="Contoh: Libur hari besar nasional"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Lokasi & Kontak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Alamat Studio</Label>
              <Input
                value={formData.store_address || ""}
                onChange={(e) => updateField("store_address", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Embed Google Maps</Label>
              <Textarea
                value={formData.map_embed || ""}
                onChange={(e) => updateField("map_embed", e.target.value)}
                placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>'
                rows={4}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Paste kode embed dari Google Maps. Buka Google Maps → Bagikan → Sematkan peta
              </p>
              {formData.map_embed && (
                <div 
                  className="mt-2 rounded-lg overflow-hidden border border-border"
                  dangerouslySetInnerHTML={{ 
                    __html: formData.map_embed.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="200"')
                  }} 
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Link Google Maps</Label>
              <Input
                value={formData.maps_link || ""}
                onChange={(e) => updateField("maps_link", e.target.value)}
                placeholder="https://maps.app.goo.gl/... atau https://www.google.com/maps/place/..."
              />
              <p className="text-xs text-muted-foreground">
                Link langsung ke lokasi di Google Maps (untuk diklik di footer)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Area Home Care</Label>
              <MultiSelectAreas
                value={selectedAreas}
                onChange={handleAreasChange}
                placeholder="Pilih area layanan home care..."
              />
              <p className="text-xs text-muted-foreground">
                Pilih area yang dilayani untuk layanan home care
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>No. WhatsApp (tanpa +)</Label>
                <Input
                  value={formData.store_phone || ""}
                  onChange={(e) => updateField("store_phone", e.target.value)}
                  placeholder="6282210400961"
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram (username)</Label>
                <Input
                  value={formData.store_instagram || ""}
                  onChange={(e) => updateField("store_instagram", e.target.value)}
                  placeholder="viliababyspa"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

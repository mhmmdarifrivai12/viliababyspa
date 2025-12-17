import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { DeleteAlertDialog } from "@/components/ui/delete-alert-dialog";
import { Plus, Pencil, Trash2, Loader2, FolderPlus, Layers, Percent } from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function TreatmentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Treatment form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [discountActive, setDiscountActive] = useState(false);

  // Category form state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryOrder, setCategoryOrder] = useState("");

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [treatmentToDelete, setTreatmentToDelete] = useState<any>(null);
  const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["treatment-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: treatments, isLoading } = useQuery({
    queryKey: ["admin-treatments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select(`
          *,
          category:treatment_categories(name)
        `)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Treatment mutations
  const saveMutation = useMutation({
    mutationFn: async (data: {
      id?: string;
      name: string;
      description: string;
      price: number;
      category_id: string | null;
      discount_percentage: number;
      discount_active: boolean;
    }) => {
      if (data.id) {
        const { error } = await supabase
          .from("treatments")
          .update({
            name: data.name,
            description: data.description,
            price: data.price,
            category_id: data.category_id,
            discount_percentage: data.discount_percentage,
            discount_active: data.discount_active,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("treatments").insert({
          name: data.name,
          description: data.description,
          price: data.price,
          category_id: data.category_id,
          discount_percentage: data.discount_percentage,
          discount_active: data.discount_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-treatments"] });
      queryClient.invalidateQueries({ queryKey: ["treatments"] });
      toast({
        title: "Berhasil",
        description: editingId ? "Treatment berhasil diperbarui" : "Treatment berhasil ditambahkan",
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("treatments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-treatments"] });
      queryClient.invalidateQueries({ queryKey: ["treatments"] });
      toast({
        title: "Berhasil",
        description: "Treatment berhasil dihapus",
      });
      setDeleteDialogOpen(false);
      setTreatmentToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Category mutations
  const saveCategoryMutation = useMutation({
    mutationFn: async (data: {
      id?: string;
      name: string;
      description: string;
      display_order: number;
    }) => {
      if (data.id) {
        const { error } = await supabase
          .from("treatment_categories")
          .update({
            name: data.name,
            description: data.description,
            display_order: data.display_order,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("treatment_categories").insert({
          name: data.name,
          description: data.description,
          display_order: data.display_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-categories"] });
      toast({
        title: "Berhasil",
        description: editingCategoryId ? "Kategori berhasil diperbarui" : "Kategori berhasil ditambahkan",
      });
      resetCategoryForm();
      setIsCategoryDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("treatment_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-treatments"] });
      toast({
        title: "Berhasil",
        description: "Kategori berhasil dihapus",
      });
      setCategoryDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message.includes("violates foreign key") 
          ? "Tidak dapat menghapus kategori yang masih memiliki treatment" 
          : error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setCategoryId("");
    setDiscountPercentage("");
    setDiscountActive(false);
    setEditingId(null);
  };

  const resetCategoryForm = () => {
    setCategoryName("");
    setCategoryDescription("");
    setCategoryOrder("");
    setEditingCategoryId(null);
  };

  const handleEdit = (treatment: any) => {
    setEditingId(treatment.id);
    setName(treatment.name);
    setDescription(treatment.description || "");
    setPrice(treatment.price.toString());
    setCategoryId(treatment.category_id || "");
    setDiscountPercentage(treatment.discount_percentage?.toString() || "");
    setDiscountActive(treatment.discount_active || false);
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryDescription(category.description || "");
    setCategoryOrder(category.display_order.toString());
    setIsCategoryDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Nama treatment harus diisi",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      id: editingId || undefined,
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      category_id: categoryId || null,
      discount_percentage: parseFloat(discountPercentage) || 0,
      discount_active: discountActive,
    });
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      toast({
        title: "Error",
        description: "Nama kategori harus diisi",
        variant: "destructive",
      });
      return;
    }

    saveCategoryMutation.mutate({
      id: editingCategoryId || undefined,
      name: categoryName.trim(),
      description: categoryDescription.trim(),
      display_order: parseInt(categoryOrder) || 0,
    });
  };

  // Count treatments per category
  const getTreatmentCount = (categoryId: string) => {
    return treatments?.filter(t => t.category_id === categoryId).length || 0;
  };

  const handleDeleteTreatmentClick = (treatment: any) => {
    setTreatmentToDelete(treatment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCategoryClick = (category: any) => {
    if (getTreatmentCount(category.id) > 0) {
      toast({
        title: "Tidak dapat menghapus",
        description: "Kategori masih memiliki treatment. Pindahkan atau hapus treatment terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }
    setCategoryToDelete(category);
    setCategoryDeleteDialogOpen(true);
  };

  const confirmDeleteTreatment = () => {
    if (treatmentToDelete) {
      deleteMutation.mutate(treatmentToDelete.id);
    }
  };

  const confirmDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete.id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Kelola Treatment</h1>
        <p className="text-muted-foreground">
          Tambah, edit, atau hapus treatment dan kategori
        </p>
      </div>

      <Tabs defaultValue="treatments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="treatments" className="gap-2">
            <Layers className="h-4 w-4" />
            Treatment
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderPlus className="h-4 w-4" />
            Kategori
          </TabsTrigger>
        </TabsList>

        {/* Treatments Tab */}
        <TabsContent value="treatments" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Treatment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Treatment" : "Tambah Treatment"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Treatment *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama treatment"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Harga (Rp) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Deskripsi treatment"
                      rows={3}
                    />
                  </div>
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-primary" />
                        <Label>Diskon</Label>
                      </div>
                      <Switch
                        checked={discountActive}
                        onCheckedChange={setDiscountActive}
                      />
                    </div>
                    {discountActive && (
                      <div className="space-y-2">
                        <Label htmlFor="discount">Persentase Diskon (%)</Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercentage}
                          onChange={(e) => setDiscountPercentage(e.target.value)}
                          placeholder="0"
                        />
                        {price && discountPercentage && (
                          <p className="text-sm text-muted-foreground">
                            Harga setelah diskon: {formatCurrency(parseFloat(price) - (parseFloat(price) * parseFloat(discountPercentage) / 100))}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={saveMutation.isPending}>
                      {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingId ? "Simpan" : "Tambah"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Daftar Treatment</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : treatments && treatments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Harga</TableHead>
                        <TableHead className="text-center">Diskon</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {treatments.map((treatment) => (
                        <TableRow key={treatment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{treatment.name}</p>
                              {treatment.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {treatment.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {treatment.category?.name && (
                              <Badge variant="secondary">
                                {treatment.category.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {treatment.discount_active && treatment.discount_percentage > 0 ? (
                              <div>
                                <span className="line-through text-muted-foreground text-sm">
                                  {formatCurrency(Number(treatment.price))}
                                </span>
                                <br />
                                <span className="text-primary">
                                  {formatCurrency(Number(treatment.price) - (Number(treatment.price) * Number(treatment.discount_percentage) / 100))}
                                </span>
                              </div>
                            ) : (
                              formatCurrency(Number(treatment.price))
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {treatment.discount_active && treatment.discount_percentage > 0 ? (
                              <Badge variant="default" className="bg-green-600">
                                {treatment.discount_percentage}% OFF
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Tidak ada
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={treatment.is_active ? "default" : "outline"}>
                              {treatment.is_active ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(treatment)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => handleDeleteTreatmentClick(treatment)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Belum ada treatment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
              setIsCategoryDialogOpen(open);
              if (!open) resetCategoryForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Kategori
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategoryId ? "Edit Kategori" : "Tambah Kategori"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Nama Kategori *</Label>
                    <Input
                      id="categoryName"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="Nama kategori"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryDescription">Deskripsi</Label>
                    <Textarea
                      id="categoryDescription"
                      value={categoryDescription}
                      onChange={(e) => setCategoryDescription(e.target.value)}
                      placeholder="Deskripsi kategori"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryOrder">Urutan Tampilan</Label>
                    <Input
                      id="categoryOrder"
                      type="number"
                      value={categoryOrder}
                      onChange={(e) => setCategoryOrder(e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Angka lebih kecil ditampilkan lebih dulu
                    </p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={saveCategoryMutation.isPending}>
                      {saveCategoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingCategoryId ? "Simpan" : "Tambah"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Daftar Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : categories && categories.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Urutan</TableHead>
                        <TableHead>Nama Kategori</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="text-center">Jumlah Treatment</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            <Badge variant="outline">{category.display_order}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {category.description || "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">
                              {getTreatmentCount(category.id)} treatment
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => handleDeleteCategoryClick(category)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Belum ada kategori</p>
                  <p className="text-sm">Tambahkan kategori untuk mengelompokkan treatment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Treatment Dialog */}
      <DeleteAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Hapus Treatment"
        description={`Apakah Anda yakin ingin menghapus treatment "${treatmentToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={confirmDeleteTreatment}
        isLoading={deleteMutation.isPending}
      />

      {/* Delete Category Dialog */}
      <DeleteAlertDialog
        open={categoryDeleteDialogOpen}
        onOpenChange={setCategoryDeleteDialogOpen}
        title="Hapus Kategori"
        description={`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={confirmDeleteCategory}
        isLoading={deleteCategoryMutation.isPending}
      />
    </div>
  );
}

import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateService, useListCategories, getGetMyServicesQueryKey } from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, PlusCircle, Upload, X, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function NewService() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useListCategories();
  const createService = useCreateService();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    deliveryDays: "",
    categoryId: "",
    tags: "",
  });

  const [uploadedImagePath, setUploadedImagePath] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response: { objectPath: string }) => {
      setUploadedImagePath(response.objectPath);
      toast({ title: "Image uploadée avec succès" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur d'upload", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Format invalide", description: "Veuillez sélectionner une image.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "La taille maximale est 5 Mo.", variant: "destructive" });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setUploadedImagePath(null);

    await uploadFile(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setUploadedImagePath(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast({ title: "Catégorie requise", variant: "destructive" });
      return;
    }
    if (imagePreview && !uploadedImagePath) {
      toast({ title: "Upload en cours", description: "Veuillez attendre la fin de l'upload.", variant: "destructive" });
      return;
    }
    createService.mutate(
      {
        data: {
          title: form.title,
          description: form.description,
          price: Number(form.price),
          deliveryDays: Number(form.deliveryDays),
          categoryId: Number(form.categoryId),
          imageUrl: uploadedImagePath ? `/api/storage${uploadedImagePath}` : undefined,
          tags: form.tags || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Service créé !", description: "Votre service est maintenant en ligne." });
          qc.invalidateQueries({ queryKey: getGetMyServicesQueryKey() });
          navigate("/freelancer/dashboard");
        },
        onError: (err: unknown) => {
          toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" });
        },
      }
    );
  };

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Créer un nouveau service</h1>
              <p className="text-muted-foreground mt-1">Proposez vos compétences à des milliers de clients</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4 border border-border rounded-xl p-6 bg-card">
                <h2 className="font-semibold">Informations générales</h2>

                <div className="space-y-1.5">
                  <Label htmlFor="title">Titre du service *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Ex: Création de CV professionnel ATS"
                    required
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">{form.title.length}/100 caractères</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Décrivez votre service en détail — ce que vous offrez, votre expérience, vos livrables..."
                    required
                    className="min-h-[150px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category">Catégorie *</Label>
                  <select
                    id="category"
                    value={form.categoryId}
                    onChange={(e) => set("categoryId", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories?.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4 border border-border rounded-xl p-6 bg-card">
                <h2 className="font-semibold">Prix et délai</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="price">Prix (FCFA) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                      placeholder="5000"
                      required
                      min="500"
                      max="5000000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="delivery">Délai de livraison (jours) *</Label>
                    <Input
                      id="delivery"
                      type="number"
                      value={form.deliveryDays}
                      onChange={(e) => set("deliveryDays", e.target.value)}
                      placeholder="3"
                      required
                      min="1"
                      max="90"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border border-border rounded-xl p-6 bg-card">
                <h2 className="font-semibold">Image & Tags</h2>

                <div className="space-y-2">
                  <Label>Image du service</Label>

                  {imagePreview ? (
                    <div className="relative">
                      <div className="aspect-video rounded-xl overflow-hidden bg-muted border border-border">
                        <img
                          src={imagePreview}
                          alt="Aperçu"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                          <div className="w-40 bg-white/30 rounded-full h-1.5">
                            <div
                              className="bg-white h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-white text-xs font-medium">{progress}%</p>
                        </div>
                      )}
                      {!isUploading && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {uploadedImagePath && (
                        <div className="absolute bottom-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                          ✓ Uploadée
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group"
                    >
                      <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                        <ImageIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">Cliquer pour uploader une image</p>
                        <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP — max 5 Mo</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                        <Upload className="w-3.5 h-3.5" />
                        Parcourir les fichiers
                      </div>
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
                  <Input
                    id="tags"
                    value={form.tags}
                    onChange={(e) => set("tags", e.target.value)}
                    placeholder="design, logo, branding"
                  />
                  <p className="text-xs text-muted-foreground">Les tags aident les clients à trouver votre service</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/freelancer/dashboard")}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground gap-2"
                  disabled={createService.isPending || isUploading}
                >
                  {createService.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Publication...</>
                    : <><PlusCircle className="w-4 h-4" />Publier le service</>}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

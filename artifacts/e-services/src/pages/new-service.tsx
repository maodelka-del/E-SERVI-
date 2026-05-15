import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateService, useListCategories, getGetMyServicesQueryKey } from "@workspace/api-client-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function NewService() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: categories } = useListCategories();
  const createService = useCreateService();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    deliveryDays: "",
    categoryId: "",
    imageUrl: "",
    tags: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast({ title: "Catégorie requise", variant: "destructive" });
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
          imageUrl: form.imageUrl || undefined,
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
                <h2 className="font-semibold">Médias & Tags</h2>

                <div className="space-y-1.5">
                  <Label htmlFor="imageUrl">URL de l'image</Label>
                  <Input
                    id="imageUrl"
                    value={form.imageUrl}
                    onChange={(e) => set("imageUrl", e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    type="url"
                  />
                  {form.imageUrl && (
                    <div className="mt-2 aspect-video max-w-xs rounded-lg overflow-hidden bg-muted">
                      <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
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
                  disabled={createService.isPending}
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

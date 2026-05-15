import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  useGetService,
  useListServiceReviews,
  useCreateOrder,
  useToggleFavorite,
  getGetServiceQueryKey,
  getListServiceReviewsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Star, Clock, ShoppingCart, Heart, Tag, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const serviceId = Number(id);
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [orderOpen, setOrderOpen] = useState(false);
  const [description, setDescription] = useState("");

  const { data: service, isLoading } = useGetService(serviceId, {
    query: { queryKey: getGetServiceQueryKey(serviceId), enabled: !!serviceId },
  });
  const { data: reviews } = useListServiceReviews(serviceId, {
    query: { queryKey: getListServiceReviewsQueryKey(serviceId), enabled: !!serviceId },
  });

  const createOrder = useCreateOrder();
  const toggleFav = useToggleFavorite();

  const handleOrder = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    setOrderOpen(true);
  };

  const submitOrder = () => {
    if (!description.trim()) {
      toast({ title: "Description requise", description: "Décrivez votre besoin", variant: "destructive" });
      return;
    }
    createOrder.mutate(
      { data: { serviceId, description } },
      {
        onSuccess: (order) => {
          setOrderOpen(false);
          toast({ title: "Commande créée !", description: "Procédez au paiement pour démarrer." });
          navigate(`/orders/${order.id}`);
        },
        onError: (err: unknown) => {
          toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" });
        },
      }
    );
  };

  const handleFav = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    toggleFav.mutate({ id: serviceId }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetServiceQueryKey(serviceId) }),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div><Skeleton className="h-64 w-full rounded-xl" /></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!service) return null;

  const freelancerName = service.freelancer?.user?.name ?? "Freelancer";
  const initials = freelancerName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const tags = service.tags ? service.tags.split(",").map(t => t.trim()) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                  {service.imageUrl ? (
                    <img src={service.imageUrl} alt={service.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <ShoppingCart className="w-16 h-16 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  {service.category && (
                    <Badge variant="secondary" className="mb-3">{service.category.name}</Badge>
                  )}
                  <h1 className="text-2xl font-bold">{service.title}</h1>

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      <span className="font-medium text-foreground">{service.rating.toFixed(1)}</span>
                      <span>({service.reviewCount} avis)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4" />
                      {service.orderCount} commandes
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Livraison en {service.deliveryDays} jour{service.deliveryDays > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <Link href={`/profile/${service.freelancerId}`}>
                    <div className="flex items-center gap-3 group">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold group-hover:text-primary transition-colors">{freelancerName}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="capitalize">{service.freelancer?.level}</Badge>
                          <span>{service.freelancer?.completedOrders} missions</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="mt-8">
                  <h2 className="text-lg font-semibold mb-3">Description</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{service.description}</p>
                </div>

                {tags.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4" /> Tags
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {reviews && reviews.length > 0 && (
                  <div className="mt-10">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 fill-accent text-accent" />
                      Avis clients ({reviews.length})
                    </h2>
                    <div className="space-y-4">
                      {reviews.map((review) => {
                        const rInit = review.client?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";
                        return (
                          <div key={review.id} className="border border-border rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">{rInit}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">{review.client?.name ?? "Client"}</div>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-accent text-accent" : "text-muted"}`} />
                                  ))}
                                </div>
                              </div>
                              <span className="ml-auto text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString("fr-SN")}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="sticky top-24"
              >
                <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {service.price.toLocaleString("fr-SN")} FCFA
                  </div>
                  <div className="text-sm text-muted-foreground mb-6">
                    Livraison en {service.deliveryDays} jour{service.deliveryDays > 1 ? "s" : ""}
                  </div>

                  <div className="space-y-3 mb-6">
                    {[
                      "Révisions incluses",
                      "Paiement sécurisé",
                      "Support inclus",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {user?.id !== service.freelancerId && (
                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mb-3"
                      size="lg"
                      onClick={handleOrder}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Commander maintenant
                    </Button>
                  )}

                  <Button variant="outline" className="w-full gap-2" onClick={handleFav}>
                    <Heart className="w-4 h-4" />
                    Ajouter aux favoris
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Passer une commande</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium text-sm">{service.title}</div>
              <div className="text-primary font-bold mt-1">{service.price.toLocaleString("fr-SN")} FCFA</div>
            </div>
            <div className="space-y-1.5">
              <Label>Décrivez votre besoin</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Expliquez ce que vous souhaitez en détail..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderOpen(false)}>Annuler</Button>
            <Button
              onClick={submitOrder}
              disabled={createOrder.isPending}
              className="bg-primary text-primary-foreground"
            >
              {createOrder.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Création...</> : "Créer la commande"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

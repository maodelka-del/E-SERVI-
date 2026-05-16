import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  useGetMyServices,
  useListOrders,
  useGetOrderStats,
  useGetFreelancerProfile,
  useDeleteService,
  getGetMyServicesQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { PlusCircle, TrendingUp, CheckCircle, Star, Edit, Trash2, Clock, Loader2, AlertTriangle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  delivered: "bg-teal-100 text-teal-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  in_progress: "En cours",
  delivered: "Livré",
  completed: "Terminé",
  cancelled: "Annulé",
};

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: services, isLoading: servicesLoading } = useGetMyServices();
  const { data: orders, isLoading: ordersLoading } = useListOrders({ role: "freelancer" });
  const { data: stats } = useGetOrderStats();
  const { data: profile } = useGetFreelancerProfile(user?.id ?? 0, {
    query: { queryKey: ["freelancer-profile", user?.id], enabled: !!user?.id },
  });

  const deleteService = useDeleteService();

  const handleDelete = (serviceId: number, title: string) => {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    deleteService.mutate({ id: serviceId }, {
      onSuccess: () => {
        toast({ title: "Service supprimé" });
        qc.invalidateQueries({ queryKey: getGetMyServicesQueryKey() });
      },
      onError: (err: unknown) => {
        toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" });
      },
    });
  };

  const activeOrders = orders?.filter(o => !["completed", "cancelled"].includes(o.status)) ?? [];

  if (user?.role !== "freelancer") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <div>
            <AlertTriangle className="w-12 h-12 text-accent mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Accès restreint</h2>
            <p className="text-muted-foreground mb-6">Ce tableau de bord est réservé aux freelancers.</p>
            <Button onClick={() => navigate("/dashboard")}>Aller au tableau de bord client</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold">Tableau de bord freelancer</h1>
                <p className="text-muted-foreground mt-1">Bonjour, {user?.name?.split(" ")[0]}</p>
              </div>
              <Link href="/freelancer/services/new">
                <Button className="gap-2 bg-primary text-primary-foreground">
                  <PlusCircle className="w-4 h-4" />
                  Nouveau service
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                {
                  icon: TrendingUp,
                  label: "Gains totaux",
                  value: profile ? `${profile.totalEarnings.toLocaleString("fr-SN")} FCFA` : "—",
                  color: "text-primary bg-primary/10",
                },
                {
                  icon: CheckCircle,
                  label: "Missions terminées",
                  value: String(profile?.completedOrders ?? stats?.completedOrders ?? "—"),
                  color: "text-green-600 bg-green-50",
                },
                {
                  icon: Star,
                  label: "Note moyenne",
                  value: profile ? profile.rating.toFixed(1) : "—",
                  color: "text-amber-600 bg-amber-50",
                },
                {
                  icon: Clock,
                  label: "En cours",
                  value: String(activeOrders.length),
                  color: "text-purple-600 bg-purple-50",
                },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="border border-border rounded-xl p-4 bg-card">
                  <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-xl font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Commandes actives</h2>
                  <Badge variant="secondary">{activeOrders.length}</Badge>
                </div>
                {ordersLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                ) : activeOrders.length > 0 ? (
                  <div className="space-y-3">
                    {activeOrders.slice(0, 5).map(order => (
                      <Link key={order.id} href={`/orders/${order.id}`}>
                        <div className="border border-border rounded-xl p-3 bg-card hover:border-primary hover:shadow-sm transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">{order.service?.title ?? `Cmd #${order.id}`}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Client: {order.client?.name ?? "—"}
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"}`}>
                              {STATUS_LABELS[order.status] ?? order.status}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-border rounded-xl text-sm text-muted-foreground">
                    Aucune commande active pour le moment
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Mes services</h2>
                  <Badge variant="secondary">{services?.length ?? 0}</Badge>
                </div>
                {servicesLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                ) : services && services.length > 0 ? (
                  <div className="space-y-3">
                    {services.map(svc => (
                      <div key={svc.id} className="border border-border rounded-xl p-3 bg-card">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <div className="font-medium text-sm truncate">{svc.title}</div>
                              {svc.status === "active" ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold flex-shrink-0">● En ligne</span>
                              ) : svc.status === "pending" ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold flex-shrink-0">⏳ En attente</span>
                              ) : svc.status === "paused" ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold flex-shrink-0">⏸ Pausé</span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold flex-shrink-0">✕ Rejeté</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="font-semibold text-primary">{svc.price.toLocaleString("fr-SN")} FCFA</span>
                              <span>·</span>
                              <Star className="w-3 h-3 fill-accent text-accent" />
                              <span>{svc.rating.toFixed(1)}</span>
                              <span>·</span>
                              <span>{svc.orderCount} cmd</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => navigate(`/services/${svc.id}`)}
                              className="p-1.5 hover:bg-muted rounded-md transition-colors"
                              title="Voir la page"
                            >
                              <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDelete(svc.id, svc.title)}
                              className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                              title="Supprimer"
                              disabled={deleteService.isPending}
                            >
                              {deleteService.isPending
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                                : <Trash2 className="w-3.5 h-3.5 text-red-500" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-border rounded-xl">
                    <p className="text-sm text-muted-foreground mb-4">Vous n'avez pas encore de service</p>
                    <Link href="/freelancer/services/new">
                      <Button variant="outline" size="sm" className="gap-1">
                        <PlusCircle className="w-4 h-4" /> Créer un service
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

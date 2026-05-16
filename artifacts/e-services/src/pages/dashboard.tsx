import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListOrders, useGetOrderStats, useListNotifications, useListServices } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CheckCircle, Clock, TrendingUp, Bell, ArrowRight, Search } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Payé", color: "bg-blue-100 text-blue-800" },
  in_progress: { label: "En cours", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Livré", color: "bg-teal-100 text-teal-800" },
  revision: { label: "Révision", color: "bg-orange-100 text-orange-800" },
  completed: { label: "Terminé", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Annulé", color: "bg-red-100 text-red-800" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useListOrders();
  const { data: stats } = useGetOrderStats();
  const { data: notifications } = useListNotifications();
  const { data: servicesData, isLoading: servicesLoading } = useListServices({ sort: "popular", limit: 4 });

  const activeOrders = orders?.filter(o => !["completed", "cancelled"].includes(o.status)) ?? [];
  const unreadNotifs = notifications?.filter(n => !n.isRead) ?? [];
  const recommendedServices = servicesData?.services ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Bonjour, {user?.name?.split(" ")[0]} 👋</h1>
              <p className="text-muted-foreground mt-1">Bienvenue sur votre tableau de bord client</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                {
                  icon: ShoppingCart,
                  label: "Commandes actives",
                  value: stats ? String(stats.pendingOrders + stats.inProgressOrders) : "—",
                  color: "text-blue-600 bg-blue-50",
                },
                {
                  icon: CheckCircle,
                  label: "Terminées",
                  value: stats ? String(stats.completedOrders) : "—",
                  color: "text-green-600 bg-green-50",
                },
                {
                  icon: Clock,
                  label: "Total commandes",
                  value: stats ? String(stats.totalOrders) : "—",
                  color: "text-purple-600 bg-purple-50",
                },
                {
                  icon: TrendingUp,
                  label: "Total dépensé",
                  value: stats ? `${stats.totalRevenue.toLocaleString("fr-SN")} FCFA` : "—",
                  color: "text-primary bg-primary/10",
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Commandes actives</h2>
                </div>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                  </div>
                ) : activeOrders.length > 0 ? (
                  <div className="space-y-3">
                    {activeOrders.slice(0, 5).map(order => {
                      const st = STATUS_LABELS[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-800" };
                      return (
                        <Link key={order.id} href={`/orders/${order.id}`}>
                          <div className="border border-border rounded-xl p-4 bg-card hover:border-primary hover:shadow-sm transition-all">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm truncate">{order.service?.title ?? `Commande #${order.id}`}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Livraison le {new Date(order.deadline).toLocaleDateString("fr-SN")}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                                <span className="font-semibold text-sm text-primary">{order.amount.toLocaleString("fr-SN")} FCFA</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border rounded-xl">
                    <ShoppingCart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">Aucune commande active</p>
                    <Link href="/services">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Search className="w-4 h-4" /> Explorer les services
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Notifications</h2>
                  {unreadNotifs.length > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-xs">{unreadNotifs.length}</Badge>
                  )}
                </div>
                {unreadNotifs.length > 0 ? (
                  <div className="space-y-2">
                    {unreadNotifs.slice(0, 5).map(n => (
                      <div key={n.id} className="border border-border rounded-lg p-3 bg-card">
                        <div className="font-medium text-xs">{n.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                      </div>
                    ))}
                    <Link href="/notifications">
                      <Button variant="ghost" size="sm" className="w-full gap-1 text-xs mt-1">
                        Voir tout <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-border rounded-xl">
                    <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Aucune notification</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Services recommandés</h2>
                <Link href="/services">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Voir tout <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
              {servicesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
                </div>
              ) : recommendedServices.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recommendedServices.map(svc => (
                    <ServiceCard key={svc.id} service={svc} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-border rounded-xl">
                  <p className="text-sm text-muted-foreground">Aucun service disponible</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

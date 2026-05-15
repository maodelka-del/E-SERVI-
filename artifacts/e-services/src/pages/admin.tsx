import { useState } from "react";
import { motion } from "framer-motion";
import {
  useGetAdminStats,
  useAdminListUsers,
  useAdminListServices,
  useAdminApproveService,
  useAdminBanUser,
  useAdminListOrders,
  getAdminListUsersQueryKey,
  getAdminListServicesQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Users, PackageOpen, ShoppingCart, TrendingUp, Ban, CheckCircle, Search, Loader2, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

export default function Admin() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [userSearch, setUserSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "services" | "orders">("overview");

  const { data: stats } = useGetAdminStats();
  const { data: users, isLoading: usersLoading } = useAdminListUsers({ q: userSearch || undefined });
  const { data: services, isLoading: servicesLoading } = useAdminListServices();
  const { data: orders } = useAdminListOrders();

  const banUser = useAdminBanUser();
  const approveService = useAdminApproveService();

  const handleBan = (userId: number, name: string, isBanned: boolean) => {
    if (!confirm(`${isBanned ? "Débannir" : "Bannir"} ${name} ?`)) return;
    banUser.mutate({ id: userId }, {
      onSuccess: () => {
        toast({ title: isBanned ? "Utilisateur débanni" : "Utilisateur banni" });
        qc.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
      },
      onError: (err: unknown) => toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" }),
    });
  };

  const handleApprove = (serviceId: number) => {
    approveService.mutate({ id: serviceId }, {
      onSuccess: () => {
        toast({ title: "Service approuvé" });
        qc.invalidateQueries({ queryKey: getAdminListServicesQueryKey() });
      },
      onError: (err: unknown) => toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" }),
    });
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <div>
            <AlertTriangle className="w-12 h-12 text-accent mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Accès restreint</h2>
            <p className="text-muted-foreground mb-6">Réservé aux administrateurs.</p>
            <Button onClick={() => navigate("/dashboard")}>Retour au tableau de bord</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const TABS = [
    { key: "overview", label: "Vue d'ensemble", icon: Shield },
    { key: "users", label: "Utilisateurs", icon: Users },
    { key: "services", label: "Services", icon: PackageOpen },
    { key: "orders", label: "Commandes", icon: ShoppingCart },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Administration</h1>
                <p className="text-muted-foreground text-sm">Gestion de la plateforme E-SERVICES</p>
              </div>
            </div>

            <div className="flex gap-1 mb-8 border border-border rounded-xl p-1 bg-muted w-fit">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: Users, label: "Utilisateurs", value: stats?.totalUsers, sub: `${stats?.totalFreelancers ?? 0} freelancers`, color: "text-blue-600 bg-blue-50" },
                    { icon: PackageOpen, label: "Services", value: stats?.totalServices, sub: "sur la plateforme", color: "text-primary bg-primary/10" },
                    { icon: ShoppingCart, label: "Commandes", value: stats?.totalOrders, sub: `${stats?.pendingOrders ?? 0} en attente`, color: "text-purple-600 bg-purple-50" },
                    { icon: TrendingUp, label: "Revenus plateforme", value: stats ? `${stats.platformCommission.toLocaleString("fr-SN")} FCFA` : "—", sub: "commission 10%", color: "text-green-600 bg-green-50" },
                  ].map(({ icon: Icon, label, value, sub, color }) => (
                    <div key={label} className="border border-border rounded-xl p-5 bg-card">
                      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-bold">{value ?? "—"}</div>
                      <div className="text-sm text-foreground font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="border border-border rounded-xl p-5 bg-card">
                    <h3 className="font-semibold mb-4">Services en attente d'approbation</h3>
                    {servicesLoading ? (
                      <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded" />)}</div>
                    ) : services?.filter(s => s.status === "pending").slice(0, 5).map(svc => (
                      <div key={svc.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{svc.title}</p>
                          <p className="text-xs text-muted-foreground">{svc.price.toLocaleString("fr-SN")} FCFA</p>
                        </div>
                        <Button size="sm" onClick={() => handleApprove(svc.id)} className="gap-1 bg-primary text-primary-foreground flex-shrink-0">
                          <CheckCircle className="w-3 h-3" /> Approuver
                        </Button>
                      </div>
                    ))}
                    {!servicesLoading && !services?.some(s => s.status === "pending") && (
                      <p className="text-sm text-muted-foreground text-center py-6">Aucun service en attente</p>
                    )}
                  </div>

                  <div className="border border-border rounded-xl p-5 bg-card">
                    <h3 className="font-semibold mb-4">Commandes récentes</h3>
                    {orders?.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{order.service?.title ?? `Cmd #${order.id}`}</p>
                          <p className="text-xs text-muted-foreground">{order.amount.toLocaleString("fr-SN")} FCFA</p>
                        </div>
                        <Badge variant="secondary" className="capitalize text-xs flex-shrink-0">
                          {order.status.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                    {!orders?.length && (
                      <p className="text-sm text-muted-foreground text-center py-6">Aucune commande</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div>
                <div className="relative mb-4 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                    placeholder="Rechercher un utilisateur..."
                  />
                </div>
                {usersLoading ? (
                  <div className="space-y-2">{Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden bg-card">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Utilisateur</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rôle</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Inscription</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {users?.map(u => {
                          const initials = u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                          return (
                            <tr key={u.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{u.name}</span>
                                  {u.isBanned && <Badge className="bg-red-100 text-red-800 text-xs">Banni</Badge>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{u.email}</td>
                              <td className="px-4 py-3">
                                <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                                {new Date(u.createdAt).toLocaleDateString("fr-SN")}
                              </td>
                              <td className="px-4 py-3">
                                {u.role !== "admin" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleBan(u.id, u.name, !!u.isBanned)}
                                    disabled={banUser.isPending}
                                    className={u.isBanned ? "text-green-600 hover:text-green-700" : "text-red-500 hover:text-red-600"}
                                  >
                                    {banUser.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {!users?.length && (
                      <div className="text-center py-10 text-sm text-muted-foreground">Aucun utilisateur trouvé</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "services" && (
              <div>
                {servicesLoading ? (
                  <div className="space-y-2">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-16 rounded-xl"/>)}</div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden bg-card">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Prix</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {services?.map(svc => (
                          <tr key={svc.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium truncate max-w-xs">{svc.title}</div>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">{svc.price.toLocaleString("fr-SN")} FCFA</td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="secondary"
                                className={svc.status === "active" ? "bg-green-100 text-green-800" : svc.status === "pending" ? "bg-yellow-100 text-yellow-800" : ""}
                              >
                                {svc.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {svc.status === "pending" && (
                                <Button size="sm" onClick={() => handleApprove(svc.id)} className="gap-1 bg-primary text-primary-foreground">
                                  <CheckCircle className="w-3 h-3" /> Approuver
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!services?.length && (
                      <div className="text-center py-10 text-sm text-muted-foreground">Aucun service</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "orders" && (
              <div className="border border-border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Commande</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Montant</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders?.map(order => (
                      <tr key={order.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium truncate max-w-xs">{order.service?.title ?? `Cmd #${order.id}`}</div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell font-semibold text-primary">
                          {order.amount.toLocaleString("fr-SN")} FCFA
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="capitalize">{order.status.replace("_", " ")}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                          {new Date(order.createdAt).toLocaleDateString("fr-SN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!orders?.length && (
                  <div className="text-center py-10 text-sm text-muted-foreground">Aucune commande</div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

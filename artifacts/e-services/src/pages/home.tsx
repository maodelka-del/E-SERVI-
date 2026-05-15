import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  useGetFeaturedServices,
  useListCategories,
  useGetTopFreelancers,
} from "@workspace/api-client-react";
import ServiceCard from "@/components/ServiceCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowRight, Star, FileText, Palette, Code2, PenTool, Monitor, Bot, GraduationCap, Smartphone, CheckCircle, Shield, Zap } from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  FileText, Palette, Code2, PenTool, Monitor, Bot, GraduationCap, Smartphone,
  Code: Code2, Presentation: Monitor, PresentationIcon: Monitor,
};

const STEPS = [
  { icon: Search, title: "Trouvez un service", desc: "Parcourez des centaines de services proposés par des freelancers vérifiés." },
  { icon: Shield, title: "Commandez en toute sécurité", desc: "Payez via DiamoPay. Votre argent est sécurisé jusqu'à la livraison." },
  { icon: CheckCircle, title: "Recevez votre livrable", desc: "Approuvez le travail et le paiement est libéré automatiquement." },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  const { data: featured, isLoading: featuredLoading } = useGetFeaturedServices();
  const { data: categories, isLoading: catLoading } = useListCategories();
  const { data: topFreelancers } = useGetTopFreelancers();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/services?q=${encodeURIComponent(searchQuery.trim())}`);
    else navigate("/services");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="bg-accent text-accent-foreground mb-4 text-sm px-3 py-1">
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              La marketplace N°1 au Sénégal
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Des talents numériques<br />
              <span className="text-accent">à portée de main</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              CV, design, développement web, présentations — trouvez le bon freelancer en quelques minutes.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-foreground bg-white text-base focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Ex: création de CV, logo, site web..."
                />
              </div>
              <Button type="submit" size="lg" className="bg-accent hover:bg-accent/90 text-white px-6 rounded-xl text-base">
                Rechercher
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {["CV professionnel", "Logo", "Site web", "PowerPoint", "Traduction"].map((q) => (
                <button
                  key={q}
                  onClick={() => navigate(`/services?q=${encodeURIComponent(q)}`)}
                  className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Explorer par catégorie</h2>
          {catLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categories?.map((cat, i) => {
                const Icon = ICON_MAP[cat.icon] ?? FileText;
                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={`/services?categoryId=${cat.id}`}
                      className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-sm">{cat.name}</div>
                        <div className="text-xs text-muted-foreground">{cat.serviceCount} services</div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Services en vedette</h2>
              <p className="text-muted-foreground text-sm mt-1">Les meilleures prestations du moment</p>
            </div>
            <Link href="/services">
              <Button variant="ghost" size="sm" className="gap-1">
                Tout voir <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden">
                  <Skeleton className="aspect-[16/10] w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured && featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.slice(0, 8).map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ServiceCard service={service} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p>Aucun service disponible pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {topFreelancers && topFreelancers.length > 0 && (
        <section className="py-16 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Top Freelancers</h2>
                <p className="text-muted-foreground text-sm mt-1">Les meilleurs experts de la plateforme</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {topFreelancers.slice(0, 6).map((fp, i) => {
                const initials = fp.user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "??";
                return (
                  <motion.div
                    key={fp.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <Link href={`/profile/${fp.userId}`}>
                      <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all">
                        <Avatar className="w-14 h-14 flex-shrink-0">
                          <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">{fp.user?.name}</span>
                            <Badge variant="secondary" className="text-xs capitalize flex-shrink-0">{fp.level}</Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Star className="w-3 h-3 fill-accent text-accent" />
                            <span>{fp.rating.toFixed(1)}</span>
                            <span>·</span>
                            <span>{fp.completedOrders} commandes</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{fp.skills}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Comment ça fonctionne ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="font-bold mb-2">{step.title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-primary text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à commencer ?</h2>
          <p className="text-white/70 mb-8 text-lg">
            Rejoignez des milliers d'utilisateurs et découvrez les meilleurs talents numériques du Sénégal.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8">
                Créer un compte gratuit
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                Explorer les services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

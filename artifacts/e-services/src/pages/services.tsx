import { useState } from "react";
import { useSearch } from "wouter";
import { motion } from "framer-motion";
import { useListServices, useListCategories } from "@workspace/api-client-react";
import ServiceCard from "@/components/ServiceCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";

export default function Services() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);

  const [q, setQ] = useState(params.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    params.get("categoryId") ? Number(params.get("categoryId")) : undefined
  );
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories } = useListCategories();
  const { data: result, isLoading } = useListServices({
    q: q || undefined,
    categoryId: selectedCategory,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort,
    page,
    limit: 12,
  });

  const services = result?.services ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / 12);

  const clearFilters = () => {
    setQ("");
    setSelectedCategory(undefined);
    setMinPrice("");
    setMaxPrice("");
    setSort("popular");
    setPage(1);
  };

  const hasFilters = q || selectedCategory || minPrice || maxPrice;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="bg-muted/30 border-b border-border py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Explorer les services</h1>
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                className="pl-9"
                placeholder="Rechercher un service..."
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 flex-shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filtres</span>
              {hasFilters && <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-primary">!</Badge>}
            </Button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="popular">Popularité</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="rating">Note</option>
              <option value="newest">Plus récents</option>
            </select>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div>
                <label className="text-sm font-medium mb-2 block">Catégorie</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(undefined)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!selectedCategory ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
                  >
                    Toutes
                  </button>
                  {categories?.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedCategory === cat.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Prix min (FCFA)</label>
                <Input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" placeholder="0" min="0" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Prix max (FCFA)</label>
                <Input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" placeholder="100000" min="0" />
              </div>
            </motion.div>
          )}

          {hasFilters && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {q && <Badge variant="secondary" className="gap-1">{q} <X className="w-3 h-3 cursor-pointer" onClick={() => setQ("")} /></Badge>}
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  {categories?.find(c => c.id === selectedCategory)?.name}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory(undefined)} />
                </Badge>
              )}
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground underline">
                Effacer tout
              </button>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {!isLoading && (
            <p className="text-sm text-muted-foreground mb-6">
              {total} service{total !== 1 ? "s" : ""} trouvé{total !== 1 ? "s" : ""}
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-border">
                  <Skeleton className="aspect-[16/10] w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : services.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {services.map((service, i) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <ServiceCard service={service} />
                  </motion.div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Précédent
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {page} sur {totalPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Suivant
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Aucun service trouvé</h3>
              <p className="text-muted-foreground text-sm mb-6">Essayez de modifier vos critères de recherche</p>
              <Button onClick={clearFilters} variant="outline">Effacer les filtres</Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

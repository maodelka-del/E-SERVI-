import { Link } from "wouter";
import { Heart, Star, Clock, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToggleFavorite } from "@workspace/api-client-react";
import type { Service } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListFavoritesQueryKey } from "@workspace/api-client-react";

interface ServiceCardProps {
  service: Service;
  isFavorited?: boolean;
}

export default function ServiceCard({ service, isFavorited = false }: ServiceCardProps) {
  const qc = useQueryClient();
  const toggle = useToggleFavorite();

  const freelancerName = service.freelancer?.user?.name ?? "Freelancer";
  const initials = freelancerName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle.mutate({ id: service.id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListFavoritesQueryKey() }),
    });
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
      <Link href={`/services/${service.id}`}>
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {service.imageUrl ? (
            <img
              src={service.imageUrl}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/50" />
            </div>
          )}
          {service.isFeatured && (
            <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs">
              En vedette
            </Badge>
          )}
          <button
            onClick={handleFavorite}
            className={`absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background ${
              isFavorited ? "text-red-500" : "text-muted-foreground"
            }`}
          >
            <Heart className="w-3.5 h-3.5" fill={isFavorited ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">{freelancerName}</span>
            {service.freelancer?.level && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-auto capitalize">
                {service.freelancer.level}
              </Badge>
            )}
          </div>

          <h3 className="font-medium text-sm line-clamp-2 flex-1 mb-3 group-hover:text-primary transition-colors">
            {service.title}
          </h3>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-accent text-accent" />
              <span className="font-medium text-foreground">{service.rating.toFixed(1)}</span>
              <span>({service.reviewCount})</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {service.deliveryDays}j
            </span>
            <span className="ml-auto">{service.orderCount} commandes</span>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">À partir de</span>
            <span className="font-bold text-primary text-base">
              {service.price.toLocaleString("fr-SN")} FCFA
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}

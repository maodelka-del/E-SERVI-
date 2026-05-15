import { Link } from "wouter";
import { PackageOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary mb-3">
              <PackageOpen className="w-5 h-5" />
              <span>E-SERVICES</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La marketplace de services numériques au Sénégal. Connectez clients et freelancers talentueux.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Marketplace</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/services" className="hover:text-foreground transition-colors">Explorer les services</Link></li>
              <li><Link href="/services?categoryId=2" className="hover:text-foreground transition-colors">Design Graphique</Link></li>
              <li><Link href="/services?categoryId=3" className="hover:text-foreground transition-colors">Développement Web</Link></li>
              <li><Link href="/services?categoryId=1" className="hover:text-foreground transition-colors">CV & Lettres</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Freelancers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/register" className="hover:text-foreground transition-colors">Devenir freelancer</Link></li>
              <li><Link href="/freelancer/services/new" className="hover:text-foreground transition-colors">Créer un service</Link></li>
              <li><Link href="/freelancer/dashboard" className="hover:text-foreground transition-colors">Tableau de bord</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Assistance</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Centre d'aide</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Conditions d'utilisation</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Politique de confidentialité</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 E-SERVICES. Tous droits réservés.</p>
          <p>Fabriqué avec soin au Sénégal</p>
        </div>
      </div>
    </footer>
  );
}

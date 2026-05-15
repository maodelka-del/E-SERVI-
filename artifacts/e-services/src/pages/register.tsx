import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PackageOpen, Eye, EyeOff, Loader2, Briefcase, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Register() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "client" });
  const [showPwd, setShowPwd] = useState(false);

  const mutation = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      { data: form },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          toast({ title: "Compte créé !", description: `Bienvenue, ${data.user.name}` });
          navigate(data.user.role === "freelancer" ? "/freelancer/dashboard" : "/dashboard");
        },
        onError: (err: unknown) => {
          toast({ title: "Erreur d'inscription", description: (err as Error).message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 relative items-center justify-center p-12">
        <div className="relative z-10 text-white max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <PackageOpen className="w-8 h-8" />
            <span className="text-2xl font-bold">E-SERVICES</span>
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Rejoignez la communauté des talents numériques
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Que vous soyez client ou freelancer, E-SERVICES vous offre la plateforme idéale pour réussir vos projets numériques.
          </p>
          <div className="mt-10 space-y-4">
            {[
              "Paiement sécurisé via DiamoPay",
              "Système d'escrow pour votre protection",
              "Freelancers vérifiés et évalués",
              "Support 7j/7",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/80 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <PackageOpen className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold text-primary">E-SERVICES</span>
          </div>

          <h1 className="text-2xl font-bold mb-1">Créer un compte</h1>
          <p className="text-muted-foreground text-sm mb-8">Rejoignez E-SERVICES gratuitement</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Je suis un...</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "client", label: "Client", icon: User, desc: "Je cherche des services" },
                  { value: "freelancer", label: "Freelancer", icon: Briefcase, desc: "Je propose des services" },
                ].map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, role: value })}
                    className={cn(
                      "flex flex-col items-center p-4 rounded-lg border-2 transition-all text-sm",
                      form.role === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 mb-1.5", form.role === value ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground text-center mt-0.5">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Mamadou Diallo"
                required
                minLength={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="vous@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Au moins 6 caractères"
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Création...</> : "Créer mon compte"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

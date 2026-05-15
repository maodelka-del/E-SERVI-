import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PackageOpen, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const mutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          toast({ title: "Bienvenue !", description: `Connecté en tant que ${data.user.name}` });
          const dest = data.user.role === "admin" ? "/admin" : data.user.role === "freelancer" ? "/freelancer/dashboard" : "/dashboard";
          navigate(dest);
        },
        onError: (err: unknown) => {
          toast({ title: "Erreur de connexion", description: (err as Error).message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary via-primary to-black/50" />
        <div className="relative z-10 text-white max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <PackageOpen className="w-8 h-8" />
            <span className="text-2xl font-bold">E-SERVICES</span>
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            La marketplace des talents numériques sénégalais
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Connectez-vous et accédez à des centaines de services professionnels ou proposez vos compétences au monde entier.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[["500+", "Freelancers"], ["2k+", "Services"], ["98%", "Satisfaction"]].map(([val, label]) => (
              <div key={label}>
                <div className="text-3xl font-bold text-accent">{val}</div>
                <div className="text-white/60 text-sm">{label}</div>
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

          <h1 className="text-2xl font-bold mb-1">Bon retour</h1>
          <p className="text-muted-foreground text-sm mb-8">Connectez-vous à votre compte</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connexion...</> : "Se connecter"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <span>Pas encore de compte ? </span>
            <Link href="/register" className="text-primary font-medium hover:underline">
              S'inscrire
            </Link>
          </div>

          <div className="mt-6 p-3 rounded-lg bg-muted text-xs text-muted-foreground">
            <p className="font-medium mb-1">Comptes de test :</p>
            <p>admin@eservices.sn / password</p>
            <p>mamadou@eservices.sn / password</p>
            <p>fatou@eservices.sn / password</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { useParams } from "wouter";
import { motion } from "framer-motion";
import {
  useGetFreelancerProfile,
  useGetMyServices,
  useListFreelancerReviews,
  getGetFreelancerProfileQueryKey,
  getListFreelancerReviewsQueryKey,
} from "@workspace/api-client-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MapPin, CheckCircle, Award } from "lucide-react";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);

  const { data: profile, isLoading } = useGetFreelancerProfile(userId, {
    query: { queryKey: getGetFreelancerProfileQueryKey(userId), enabled: !!userId },
  });
  const { data: reviews } = useListFreelancerReviews(userId, {
    query: { queryKey: getListFreelancerReviewsQueryKey(userId), enabled: !!userId },
  });
  const { data: myServices } = useGetMyServices();

  const name = profile?.user?.name ?? "Freelancer";
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const skills = profile?.skills ? profile.skills.split(",").map((s) => s.trim()) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
          <div className="flex items-start gap-6">
            <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Profil introuvable ou utilisateur non freelancer.</p>
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
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="border border-border rounded-2xl p-6 bg-card mb-8">
              <div className="flex items-start gap-6 flex-wrap">
                <Avatar className="w-24 h-24 flex-shrink-0">
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h1 className="text-2xl font-bold">{name}</h1>
                    {profile.user?.isVerified && (
                      <Badge className="gap-1 bg-blue-100 text-blue-800">
                        <CheckCircle className="w-3 h-3" /> Vérifié
                      </Badge>
                    )}
                    <Badge variant="secondary" className="capitalize gap-1">
                      <Award className="w-3 h-3" /> {profile.level}
                    </Badge>
                    {profile.isAvailable && (
                      <Badge className="bg-green-100 text-green-800">Disponible</Badge>
                    )}
                  </div>

                  {profile.user?.bio && (
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">{profile.user.bio}</p>
                  )}

                  {profile.user?.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      {profile.user.location}
                    </div>
                  )}

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {skills.map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    {[
                      { label: "Note", value: <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-accent text-accent" />{profile.rating.toFixed(1)}</span> },
                      { label: "Avis", value: String(profile.reviewCount) },
                      { label: "Missions", value: String(profile.completedOrders) },
                      { label: "Gains", value: `${profile.totalEarnings.toLocaleString("fr-SN")} FCFA` },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center border border-border rounded-xl p-3">
                        <div className="font-bold text-lg">{value}</div>
                        <div className="text-xs text-muted-foreground">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {myServices && myServices.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Services proposés</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {myServices.map((svc, i) => (
                    <motion.div
                      key={svc.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <ServiceCard service={svc} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {reviews && reviews.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 fill-accent text-accent" />
                  Avis ({reviews.length})
                </h2>
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const rInit = review.client?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";
                    return (
                      <div key={review.id} className="border border-border rounded-xl p-4 bg-card">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">{rInit}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{review.client?.name ?? "Client"}</div>
                            <div className="flex items-center gap-0.5 mt-0.5">
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
      </main>

      <Footer />
    </div>
  );
}

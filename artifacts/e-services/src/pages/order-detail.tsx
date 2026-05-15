import { useState } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import {
  useGetOrder,
  useListMessages,
  useSendMessage,
  useDeliverOrder,
  useAcceptDelivery,
  useRequestRevision,
  useCancelOrder,
  useCreateCheckout,
  useCreateReview,
  getGetOrderQueryKey,
  getListMessagesQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, CheckCircle, RotateCcw, XCircle, CreditCard, Upload, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "pending", label: "Commandé" },
  { key: "paid", label: "Payé" },
  { key: "in_progress", label: "En cours" },
  { key: "delivered", label: "Livré" },
  { key: "completed", label: "Terminé" },
];

const STEP_INDEX: Record<string, number> = {
  pending: 0, paid: 1, in_progress: 2, delivered: 3, revision: 3, completed: 4, cancelled: -1,
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [message, setMessage] = useState("");
  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { queryKey: getGetOrderQueryKey(orderId), enabled: !!orderId },
  });
  const { data: messages } = useListMessages(orderId, {
    query: { queryKey: getListMessagesQueryKey(orderId), enabled: !!orderId },
  });

  const sendMessage = useSendMessage();
  const deliverOrder = useDeliverOrder();
  const acceptDelivery = useAcceptDelivery();
  const requestRevision = useRequestRevision();
  const cancelOrder = useCancelOrder();
  const createCheckout = useCreateCheckout();
  const createReview = useCreateReview();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
    qc.invalidateQueries({ queryKey: getListMessagesQueryKey(orderId) });
  };

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate(
      { orderId, data: { content: message } },
      {
        onSuccess: () => { setMessage(""); invalidate(); },
        onError: (err: unknown) => toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  const handleDeliver = () => {
    if (!deliveryUrl.trim()) {
      toast({ title: "URL requise", variant: "destructive" });
      return;
    }
    deliverOrder.mutate(
      { id: orderId, data: { deliveryUrl } },
      {
        onSuccess: () => { setDeliverOpen(false); invalidate(); toast({ title: "Livraison envoyée !" }); },
        onError: (err: unknown) => toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  const handleAccept = () => {
    acceptDelivery.mutate(
      { id: orderId },
      {
        onSuccess: () => { invalidate(); toast({ title: "Livraison acceptée !" }); setReviewOpen(true); },
        onError: (err: unknown) => toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  const handleRevision = () => {
    if (!revisionNote.trim()) {
      toast({ title: "Note requise", variant: "destructive" });
      return;
    }
    requestRevision.mutate(
      { id: orderId, data: { note: revisionNote } },
      {
        onSuccess: () => { setRevisionOpen(false); invalidate(); toast({ title: "Révision demandée" }); },
        onError: (err: unknown) => toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  const handleCancel = () => {
    if (!confirm("Annuler cette commande ?")) return;
    cancelOrder.mutate(
      { id: orderId },
      {
        onSuccess: () => { invalidate(); toast({ title: "Commande annulée" }); },
        onError: (err: unknown) => toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  const handlePayment = () => {
    createCheckout.mutate(
      { data: { orderId } },
      {
        onSuccess: (data) => {
          toast({ title: "Redirection vers le paiement..." });
          window.open(data.paymentUrl, "_blank");
        },
        onError: (err: unknown) => toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  const handleReview = () => {
    createReview.mutate(
      { data: { orderId, rating: reviewRating, comment: reviewComment } },
      {
        onSuccess: () => { setReviewOpen(false); toast({ title: "Avis publié !" }); },
        onError: (err: unknown) => toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  const isClient = user?.id === order?.clientId;
  const isFreelancer = user?.id === order?.freelancerId;
  const currentStep = order ? STEP_INDEX[order.status] ?? 0 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold">{order.service?.title ?? `Commande #${order.id}`}</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Commande #{order.id} · {new Date(order.createdAt).toLocaleDateString("fr-SN")}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{order.amount.toLocaleString("fr-SN")} FCFA</div>
                  <div className="text-xs text-muted-foreground">Livraison le {new Date(order.deadline).toLocaleDateString("fr-SN")}</div>
                </div>
              </div>
            </div>

            {order.status !== "cancelled" && (
              <div className="border border-border rounded-xl p-6 bg-card mb-6">
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-0 right-0 top-4 h-0.5 bg-border -z-10 mx-12" />
                  {STEPS.map((step, i) => {
                    const done = i < currentStep;
                    const active = i === currentStep;
                    return (
                      <div key={step.key} className="flex flex-col items-center gap-2 z-10">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                          done ? "bg-primary border-primary" :
                          active ? "bg-primary/10 border-primary" :
                          "bg-background border-border"
                        )}>
                          {done ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <span className={cn("text-xs font-bold", active ? "text-primary" : "text-muted-foreground")}>
                              {i + 1}
                            </span>
                          )}
                        </div>
                        <span className={cn("text-xs font-medium hidden sm:block", active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground")}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {order.status === "revision" && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg text-sm text-orange-800">
                    Révision demandée : {order.revisionNote}
                  </div>
                )}
                {order.deliveryUrl && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm">
                    <span className="font-medium text-green-800">Livrable : </span>
                    <a href={order.deliveryUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Voir le livrable
                    </a>
                  </div>
                )}
              </div>
            )}

            {order.status === "cancelled" && (
              <div className="border border-red-200 bg-red-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Commande annulée</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-6">
              {isClient && order.status === "pending" && (
                <Button onClick={handlePayment} disabled={createCheckout.isPending} className="gap-2 bg-primary text-primary-foreground">
                  {createCheckout.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Payer {order.amount.toLocaleString("fr-SN")} FCFA
                </Button>
              )}
              {isClient && order.status === "delivered" && (
                <>
                  <Button onClick={handleAccept} disabled={acceptDelivery.isPending} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                    {acceptDelivery.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Accepter la livraison
                  </Button>
                  <Button variant="outline" onClick={() => setRevisionOpen(true)} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Demander une révision
                  </Button>
                </>
              )}
              {isFreelancer && ["paid", "in_progress", "revision"].includes(order.status) && (
                <Button onClick={() => setDeliverOpen(true)} className="gap-2 bg-primary text-primary-foreground">
                  <Upload className="w-4 h-4" />
                  Livrer le travail
                </Button>
              )}
              {(isClient || isFreelancer) && ["pending", "paid"].includes(order.status) && (
                <Button variant="outline" onClick={handleCancel} disabled={cancelOrder.isPending} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
                  {cancelOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Annuler
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-border rounded-xl bg-card flex flex-col" style={{ height: "400px" }}>
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages && messages.length > 0 ? (
                    messages.map((msg) => {
                      const mine = msg.senderId === user?.id;
                      const init = msg.sender?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";
                      return (
                        <div key={msg.id} className={cn("flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
                          <Avatar className="w-7 h-7 flex-shrink-0">
                            <AvatarFallback className="text-xs">{init}</AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "max-w-[75%] rounded-xl px-3 py-2 text-sm",
                            mine ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}>
                            <p>{msg.content}</p>
                            <p className={cn("text-xs mt-1", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                              {new Date(msg.createdAt).toLocaleTimeString("fr-SN", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Aucun message pour le moment
                    </div>
                  )}
                </div>
                {order.status !== "completed" && order.status !== "cancelled" && (
                  <div className="p-3 border-t border-border flex gap-2">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Écrire un message..."
                      className="min-h-0 h-10 resize-none flex-1 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleSend}
                      disabled={sendMessage.isPending || !message.trim()}
                      className="bg-primary text-primary-foreground flex-shrink-0"
                    >
                      {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
              </div>

              <div className="border border-border rounded-xl p-5 bg-card space-y-4 h-fit">
                <h2 className="font-semibold">Détails de la commande</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut</span>
                    <Badge variant="secondary" className="capitalize">{order.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant</span>
                    <span className="font-semibold">{order.amount.toLocaleString("fr-SN")} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Délai de livraison</span>
                    <span>{order.deliveryDays} jours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date limite</span>
                    <span>{new Date(order.deadline).toLocaleDateString("fr-SN")}</span>
                  </div>
                  {isFreelancer && (
                    <div className="flex justify-between border-t border-border pt-3">
                      <span className="text-muted-foreground">Votre gain</span>
                      <span className="font-bold text-primary">{order.freelancerAmount.toLocaleString("fr-SN")} FCFA</span>
                    </div>
                  )}
                </div>

                {order.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Description client</p>
                    <p className="text-sm bg-muted rounded-lg p-3">{order.description}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {(isClient ? order.freelancer?.user?.name : order.client?.name)
                          ?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-medium">
                        {isClient ? order.freelancer?.user?.name : order.client?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{isClient ? "Freelancer" : "Client"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />

      <Dialog open={deliverOpen} onOpenChange={setDeliverOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Livrer le travail</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <div className="space-y-1.5">
              <Label>URL du livrable</Label>
              <Input value={deliveryUrl} onChange={(e) => setDeliveryUrl(e.target.value)} placeholder="https://drive.google.com/..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliverOpen(false)}>Annuler</Button>
            <Button onClick={handleDeliver} disabled={deliverOrder.isPending} className="bg-primary text-primary-foreground">
              {deliverOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Livrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Demander une révision</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <div className="space-y-1.5">
              <Label>Expliquez ce qui doit être modifié</Label>
              <Textarea value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} className="min-h-[100px]" placeholder="Décrivez les modifications souhaitées..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisionOpen(false)}>Annuler</Button>
            <Button onClick={handleRevision} disabled={requestRevision.isPending} className="bg-primary text-primary-foreground">
              {requestRevision.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Laisser un avis</DialogTitle></DialogHeader>
          <div className="py-2 space-y-4">
            <div>
              <Label className="mb-2 block">Note</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button key={r} onClick={() => setReviewRating(r)}>
                    <Star className={cn("w-7 h-7 transition-colors", r <= reviewRating ? "fill-accent text-accent" : "text-muted-foreground")} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Commentaire</Label>
              <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Partagez votre expérience..." className="min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Passer</Button>
            <Button onClick={handleReview} disabled={createReview.isPending} className="bg-primary text-primary-foreground">
              {createReview.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Publier l'avis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { motion } from "framer-motion";
import {
  useListNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  order_new: "bg-blue-100 text-blue-800",
  order_paid: "bg-green-100 text-green-800",
  order_delivered: "bg-teal-100 text-teal-800",
  order_completed: "bg-green-100 text-green-800",
  order_cancelled: "bg-red-100 text-red-800",
  order_revision: "bg-orange-100 text-orange-800",
  review_new: "bg-yellow-100 text-yellow-800",
  message_new: "bg-purple-100 text-purple-800",
  payment_received: "bg-green-100 text-green-800",
  default: "bg-gray-100 text-gray-800",
};

export default function Notifications() {
  const qc = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  const handleMarkAll = () => {
    markAll.mutate(undefined, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bell className="w-6 h-6 text-primary" />
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-muted-foreground text-sm mt-1">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAll} className="gap-2 text-xs">
                <CheckCheck className="w-4 h-4" />
                Tout marquer lu
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notif, i) => {
                const color = TYPE_COLORS[notif.type] ?? TYPE_COLORS.default;
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                    className={cn(
                      "border rounded-xl p-4 transition-all cursor-pointer",
                      notif.isRead
                        ? "border-border bg-card opacity-70 hover:opacity-100"
                        : "border-primary/30 bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5", color)}>
                        {notif.type.replace(/_/g, " ")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn("text-sm font-medium", !notif.isRead && "text-foreground")}>
                            {notif.title}
                          </p>
                          {!notif.isRead && <Badge className="bg-primary text-primary-foreground text-xs flex-shrink-0">Nouveau</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {new Date(notif.createdAt).toLocaleString("fr-SN", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
                <BellOff className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Aucune notification</h3>
              <p className="text-muted-foreground text-sm">Vous serez notifié des activités importantes ici.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  company_id: string;
}

interface Message {
  id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
}

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-muted text-muted-foreground",
};
const statusLabels: Record<string, string> = { open: "Aberto", in_progress: "Em progresso", resolved: "Resolvido", closed: "Fechado" };

const AdminTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
    setTickets((data as Ticket[]) || []);
    setLoading(false);
  };

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase.from("ticket_messages").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
  };

  useEffect(() => { fetchTickets(); }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      const channel = supabase
        .channel(`admin-ticket-${selectedTicket.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${selectedTicket.id}` }, (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedTicket]);

  const sendReply = async () => {
    if (!selectedTicket || !user || !replyMessage.trim()) return;
    setSendingReply(true);
    await supabase.from("ticket_messages").insert({
      ticket_id: selectedTicket.id,
      sender_id: user.id,
      message: replyMessage,
      is_admin_reply: true,
    });
    setReplyMessage("");
    setSendingReply(false);
  };

  const updateStatus = async (ticketId: string, status: string) => {
    await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
    toast.success("Estado atualizado!");
    fetchTickets();
    if (selectedTicket?.id === ticketId) setSelectedTicket((prev) => prev ? { ...prev, status } : null);
  };

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-8">Gestão de Tickets</h1>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1 space-y-2 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
            ) : tickets.map((ticket) => (
              <button key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                className={`w-full text-left rounded-lg border p-4 transition-colors ${selectedTicket?.id === ticket.id ? "border-accent bg-accent/5" : "border-border bg-card hover:bg-muted/50"}`}>
                <p className="font-medium text-foreground text-sm truncate">{ticket.subject}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className={`text-xs ${statusColors[ticket.status]}`}>{statusLabels[ticket.status]}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString("pt-PT")}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="md:col-span-2 rounded-lg border border-border bg-card shadow-document">
            {selectedTicket ? (
              <div className="flex flex-col h-[600px]">
                <div className="border-b border-border p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{selectedTicket.subject}</h3>
                  </div>
                  <Select value={selectedTicket.status} onValueChange={(v) => updateStatus(selectedTicket.id, v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em progresso</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.is_admin_reply ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${msg.is_admin_reply ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        {!msg.is_admin_reply && <p className="text-xs font-medium mb-1 opacity-70">Cliente</p>}
                        <p>{msg.message}</p>
                        <p className="text-xs opacity-60 mt-1">{new Date(msg.created_at).toLocaleString("pt-PT")}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border p-4 flex gap-2">
                  <Input value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Responder ao ticket..." onKeyDown={(e) => e.key === "Enter" && sendReply()} />
                  <Button onClick={sendReply} disabled={sendingReply} size="icon"><MessageSquare className="h-4 w-4" /></Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                <p className="text-sm">Selecione um ticket</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminTickets;

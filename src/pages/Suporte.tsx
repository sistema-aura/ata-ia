import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
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

const statusLabels: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em progresso",
  resolved: "Resolvido",
  closed: "Fechado",
};

const Suporte = () => {
  const { company, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    if (!company) return;
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });
    setTickets((data as Ticket[]) || []);
    setLoading(false);
  };

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
  };

  useEffect(() => {
    fetchTickets();
  }, [company]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      // Realtime
      const channel = supabase
        .channel(`ticket-${selectedTicket.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${selectedTicket.id}` }, (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedTicket]);

  const createTicket = async () => {
    if (!company || !user || !newSubject.trim() || !newMessage.trim()) return;
    setCreating(true);
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({ company_id: company.id, created_by: user.id, subject: newSubject })
      .select()
      .single();

    if (error || !ticket) {
      toast.error("Erro ao criar ticket");
      setCreating(false);
      return;
    }

    await supabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      message: newMessage,
      is_admin_reply: false,
    });

    toast.success("Ticket criado com sucesso!");
    setNewSubject("");
    setNewMessage("");
    setDialogOpen(false);
    setCreating(false);
    fetchTickets();
  };

  const sendReply = async () => {
    if (!selectedTicket || !user || !replyMessage.trim()) return;
    setSendingReply(true);
    await supabase.from("ticket_messages").insert({
      ticket_id: selectedTicket.id,
      sender_id: user.id,
      message: replyMessage,
      is_admin_reply: false,
    });
    setReplyMessage("");
    setSendingReply(false);
  };

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Suporte</h1>
            <p className="text-muted-foreground">Abra um ticket e a nossa equipa irá ajudar</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Ticket</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Ticket de Suporte</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Descreva brevemente o problema" />
                </div>
                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Explique em detalhe o que precisa..." rows={5} />
                </div>
                <Button onClick={createTicket} disabled={creating} className="w-full">
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Ticket
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Ticket list */}
          <div className="md:col-span-1 space-y-2">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem tickets</p>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left rounded-lg border p-4 transition-colors ${selectedTicket?.id === ticket.id ? "border-accent bg-accent/5" : "border-border bg-card hover:bg-muted/50"}`}
                >
                  <p className="font-medium text-foreground text-sm truncate">{ticket.subject}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className={`text-xs ${statusColors[ticket.status]}`}>{statusLabels[ticket.status]}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString("pt-PT")}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Chat */}
          <div className="md:col-span-2 rounded-lg border border-border bg-card shadow-document">
            {selectedTicket ? (
              <div className="flex flex-col h-[500px]">
                <div className="border-b border-border p-4">
                  <h3 className="font-heading font-semibold text-foreground">{selectedTicket.subject}</h3>
                  <Badge variant="secondary" className={`text-xs mt-1 ${statusColors[selectedTicket.status]}`}>{statusLabels[selectedTicket.status]}</Badge>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.is_admin_reply ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${msg.is_admin_reply ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"}`}>
                        {msg.is_admin_reply && <p className="text-xs font-medium mb-1 opacity-70">Suporte</p>}
                        <p>{msg.message}</p>
                        <p className="text-xs opacity-60 mt-1">{new Date(msg.created_at).toLocaleString("pt-PT")}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedTicket.status !== "closed" && (
                  <div className="border-t border-border p-4 flex gap-2">
                    <Input value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Escreva uma mensagem..." onKeyDown={(e) => e.key === "Enter" && sendReply()} />
                    <Button onClick={sendReply} disabled={sendingReply} size="icon">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                <p className="text-sm">Selecione um ticket para ver as mensagens</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Suporte;

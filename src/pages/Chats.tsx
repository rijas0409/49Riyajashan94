import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, ArrowLeft, MessageCircle } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";

interface Chat {
  id: string;
  pet_id: string;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string | null;
  pet?: {
    name: string;
    images: string[];
  };
  buyer?: {
    name: string;
    profile_photo: string | null;
  };
  seller?: {
    name: string;
    profile_photo: string | null;
  };
}

const Chats = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    const { data, error } = await supabase
      .from("chats")
      .select(`
        *,
        pet:pets(name, images),
        buyer:profiles!chats_buyer_id_fkey(name, profile_photo),
        seller:profiles!chats_seller_id_fkey(name, profile_photo)
      `)
      .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Error fetching chats:", error);
    } else {
      setChats(data || []);
    }
    setLoading(false);
  };

  const getOtherParty = (chat: Chat) => {
    return chat.buyer_id === userId ? chat.seller : chat.buyer;
  };

  const getInitial = (name: string) => {
    return name?.[0]?.toUpperCase() || "U";
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString("en-IN", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Chats
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground text-sm">
              Start a conversation by contacting a seller about a pet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => {
              const otherParty = getOtherParty(chat);
              return (
                <Card
                  key={chat.id}
                  className="p-4 cursor-pointer hover:shadow-card transition-all rounded-2xl border-0 shadow-sm"
                  onClick={() => navigate(`/chat/${chat.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                      {otherParty?.profile_photo ? (
                        <img
                          src={otherParty.profile_photo}
                          alt={otherParty.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
                          {getInitial(otherParty?.name || "")}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold truncate">{otherParty?.name || "User"}</h3>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(chat.last_message_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {chat.last_message || "No messages yet"}
                      </p>
                      {chat.pet && (
                        <p className="text-xs text-primary mt-1">
                          Re: {chat.pet.name}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Chats;

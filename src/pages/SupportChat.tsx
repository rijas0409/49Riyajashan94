import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  ArrowLeft, Send, Sparkles, AlertCircle,
  Calendar, ShoppingBag, CreditCard, Shield, Loader2, User,
  ChevronRight, Headphones, Wallet, Stethoscope, Truck, Tag, 
  Heart, MapPin, MessageSquare, FileText, HelpCircle, MessageCircle
} from "lucide-react";
import sruvoHelpMascots from "@/assets/images/sruvo_help_mascots_1784534077052.jpg";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function SupportChat() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [view, setView] = useState<"help" | "chat">("help");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am Sruvo's Care Assistant. 🐾\n\nAsk me anything about your vet consultations, Smart Match bookings, payments, refunds, or pet passports. I'm here to resolve any issues instantly!"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (view === "chat") {
      scrollToBottom();
    }
  }, [messages, loading, view]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInputValue("");
    setLoading(true);

    try {
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          messages: updatedMessages,
          userId: profile?.id || null,
          profile: profile || null,
          currentPath: "/buyer/support"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach Sruvo support API");
      }

      const data = await response.json();
      if (data.response) {
        setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("No response content from Sruvo server");
      }
    } catch (error: any) {
      console.error("[SupportChat Error]", error);
      toast.error("Connecting to Sruvo support failed. Let's try again!");
      setMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: "I ran into a small connection hiccup with our server. Please retry sending your message, and I'll jump right back in!" 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (title: string, customQuery?: string) => {
    setView("chat");
    const query = customQuery || `Help with ${title}`;
    handleSend(query);
  };

  const getInitial = () => {
    const name = profile?.full_name || profile?.name || "Pet Parent";
    return name[0]?.toUpperCase() || "P";
  };

  // Helper lists of queries with specific icons and descriptions matching screenshot exactly
  const otherQueries = [
    {
      title: "Smart Match & Vet Consultation",
      subtitle: "Get help with vet consultations, bookings and Smart Match",
      icon: Stethoscope,
      query: "I need help with my vet consultation booking and Smart Match."
    },
    {
      title: "Pet Passport",
      subtitle: "View, update and manage your pet's passport & health records",
      icon: Shield,
      query: "I need help with viewing, updating, or syncing my pet passport."
    },
    {
      title: "Shop Orders",
      subtitle: "Track orders, returns, refunds and product related issues",
      icon: ShoppingBag,
      query: "I want to get support for Sruvo shop orders, returns, or product issues."
    },
    {
      title: "Delivery & Tracking",
      subtitle: "Track deliveries, address changes and delivery related support",
      icon: Truck,
      query: "How do I track my delivery or change my delivery address?"
    },
    {
      title: "Payments & Refunds",
      subtitle: "Payment issues, refunds, wallet and transaction related help",
      icon: CreditCard,
      query: "I have some payment, transaction, or refund queries."
    },
    {
      title: "Account & Profile",
      subtitle: "Login issues, profile updates, notifications and app related help",
      icon: User,
      query: "I need help updating my account profile, settings, or login."
    },
    {
      title: "Offers & Promotions",
      subtitle: "Help with coupons, offers and promotional deals",
      icon: Tag,
      query: "I have a question about active coupon codes, discounts, or promotions."
    },
    {
      title: "Pet Care & Health",
      subtitle: "General pet care guidance and health related queries",
      icon: Heart,
      query: "I need some general advice regarding pet care, nutrition, or health."
    },
    {
      title: "Service Availability",
      subtitle: "Check serviceability in your area and related queries",
      icon: MapPin,
      query: "Is Sruvo service available in my pin code?"
    },
    {
      title: "Report an Issue",
      subtitle: "Report bugs, technical issues or unexpected problems",
      icon: MessageSquare,
      query: "I want to report a technical bug or unexpected app issue."
    },
    {
      title: "Policies & Terms",
      subtitle: "Our policies, terms of use and guidelines",
      icon: FileText,
      query: "Where can I view Sruvo policies, refund terms, and guidelines?"
    },
    {
      title: "Other Queries",
      subtitle: "Can't find what you're looking for? Ask us",
      icon: HelpCircle,
      query: "I have another query that isn't listed here."
    }
  ];

  // Render Sruvo Help Center Landing Page (matches reference screenshot exactly)
  if (view === "help") {
    return (
      <div className="min-h-screen bg-[#FAF9FC] flex flex-col font-sans select-none pb-12">
        
        {/* HEADER SECTION */}
        <header className="bg-[#FAF9FC] px-5 py-5 flex-shrink-0">
          <div className="max-w-2xl mx-auto flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <Button
                variant="ghost"
                size="icon"
                id="back-to-profile-btn"
                className="rounded-full hover:bg-slate-100/60 transition-colors w-9 h-9 shrink-0 -ml-1"
                onClick={() => navigate("/buyer/profile")}
              >
                <ArrowLeft className="w-6 h-6 text-slate-800" strokeWidth={2.2} />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">
                  Help &amp; Support
                </h1>
                <p className="text-xs text-[#7E8594] font-medium tracking-tight mt-1.5 max-w-[90%] leading-relaxed">
                  Get support for pet care, orders, payments, and everything on Sruvo.
                </p>
              </div>
            </div>
            
            {/* Circular Sruvo AI Headset Icon */}
            <div 
              onClick={() => setView("chat")}
              className="w-11 h-11 rounded-full bg-[#5D3BF2] flex items-center justify-center shrink-0 cursor-pointer shadow-[0_3px_10px_rgba(93,59,242,0.18)] hover:scale-105 active:scale-95 transition-all text-white"
            >
              <Headphones className="w-5 h-5" strokeWidth={2.2} />
            </div>
          </div>
        </header>

        {/* MAIN BODY SCROLLABLE AREA */}
        <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-2 space-y-6">
          
          {/* TOP CARD: REFUND SUMMARY CARD WITH ILLUSTRATION */}
          <div 
            onClick={() => handleItemClick("Payments & Refunds", "Show my active refunds status.")}
            className="bg-gradient-to-r from-[#FFF5F1] to-[#FFFBF9] border border-[#FFE7DD]/80 rounded-[24px] p-5 pr-32 flex items-center justify-between relative overflow-hidden shadow-[0_2px_12px_rgba(253,92,34,0.04)] cursor-pointer hover:border-[#FFA585] transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-4 relative z-10">
              {/* Wallet Icon in white circle */}
              <div className="w-14 h-14 rounded-full bg-white border border-[#FFF0EA] flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(255,91,34,0.06)]">
                <Wallet className="w-6 h-6 text-[#FF5B22]" strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-[15px] md:text-[16px] font-bold text-slate-800 leading-snug">
                  You have 0 active refunds
                </h2>
                <div className="flex items-center gap-1 text-sm font-bold text-[#FF5B22] mt-1 hover:opacity-90 transition-opacity">
                  <span>View My Refunds</span>
                  <ChevronRight className="w-4 h-4 mt-0.5" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Puppy & Kitten Illustration sitting on the right edge */}
            <div className="absolute right-2.5 bottom-0 w-32 h-[82px] overflow-hidden pointer-events-none flex items-end justify-end">
              <img 
                src={sruvoHelpMascots} 
                alt="Puppy & Kitten" 
                className="w-full h-full object-contain object-bottom mix-blend-multiply" 
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* RECENT SECTION */}
          <div>
            <h3 className="text-[11px] font-bold text-[#7E8594] tracking-wider mb-2.5 uppercase px-1">
              RECENT
            </h3>
            <div 
              onClick={() => handleItemClick("Issues with Recent Orders", "I have an issue with my recent shop order.")}
              className="bg-white rounded-[20px] border border-[#E9ECF0] p-4.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 active:scale-[0.99] transition-all shadow-[0_2px_8px_rgba(26,28,30,0.015)]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#F3EFFF] flex items-center justify-center text-[#5D3BF2] shrink-0">
                  <ShoppingBag className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] text-[#1A1C1E] leading-snug">
                    Issues with Recent Orders
                  </span>
                  <span className="text-xs text-[#7E8594] mt-0.5 font-medium">
                    Get help with your pet shop orders
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#B2B9C5]" strokeWidth={2} />
            </div>
          </div>

          {/* HELP WITH OTHER QUERIES SECTION */}
          <div>
            <h3 className="text-[11px] font-bold text-[#7E8594] tracking-wider mb-2.5 uppercase px-1">
              HELP WITH OTHER QUERIES
            </h3>
            <div className="bg-white rounded-[24px] border border-[#E9ECF0] overflow-hidden divide-y divide-[#F1F3F6] shadow-[0_2px_12px_rgba(26,28,30,0.015)]">
              {otherQueries.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => handleItemClick(item.title, item.query)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#F3EFFF] flex items-center justify-center text-[#5D3BF2] shrink-0">
                        <Icon className="w-5 h-5" strokeWidth={2.2} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[15px] text-[#1A1C1E] leading-snug">
                          {item.title}
                        </span>
                        <span className="text-xs text-[#7E8594] mt-0.5 font-medium max-w-[92%] leading-tight">
                          {item.subtitle}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#B2B9C5] shrink-0" strokeWidth={2} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* CONVERSATION ARCHIVES SECTION */}
          <div>
            <h3 className="text-[11px] font-bold text-[#7E8594] tracking-wider mb-2.5 uppercase px-1">
              CONVERSATION ARCHIVES
            </h3>
            <div 
              onClick={() => {
                toast.success("Opening conversation archive...");
                setView("chat");
                setMessages(prev => [
                  ...prev,
                  { role: "user", content: "Show me my past support conversation history." },
                  { role: "assistant", content: "I've fetched your archive. Your last resolved ticket was for 'Where is my order?' which was marked completed. Let me know if you want details or need to open a new case!" }
                ]);
              }}
              className="bg-white rounded-[20px] border border-[#E9ECF0] p-4.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 active:scale-[0.99] transition-all shadow-[0_2px_8px_rgba(26,28,30,0.015)]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#F3EFFF] flex items-center justify-center text-[#5D3BF2] shrink-0">
                  <MessageSquare className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] text-[#1A1C1E] leading-snug">
                    All conversation threads
                  </span>
                  <span className="text-xs text-[#7E8594] mt-0.5 font-medium">
                    View all your conversation threads and support cases
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#B2B9C5]" strokeWidth={2} />
            </div>
          </div>

        </main>
      </div>
    );
  }

  // Render Interactive Chat UI (when view === "chat")
  return (
    <div className="h-screen bg-[#f8fafc] flex flex-col font-sans overflow-hidden">
      {/* Sruvo Premium Support Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 shadow-xs z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              id="back-to-help-btn"
              className="rounded-full hover:bg-slate-100 transition-colors w-9 h-9"
              onClick={() => setView("help")}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <div>
              <h1 className="text-sm md:text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                Sruvo Help Center
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f22c83]/10 text-[#f22c83] border border-[#f22c83]/10">
                  AI Support
                </span>
              </h1>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                We are online & ready to help
              </p>
            </div>
          </div>
          
          <div className="w-9 h-9 rounded-full overflow-hidden bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0 shadow-xs">
            {profile?.photo ? (
              <img src={profile.photo} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-sm font-semibold text-purple-700">{getInitial()}</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Interactive Support Chat Container */}
      <main className="flex-1 overflow-hidden flex flex-col max-w-2xl mx-auto w-full bg-white border-x border-gray-100 shadow-xs relative">
        
        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          
          {/* Brand Welcome Banner */}
          <div className="bg-gradient-to-r from-purple-900 via-[#821bb3] to-[#f22c83] rounded-2xl p-5 text-white shadow-sm mb-4 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-pink-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="relative z-10 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner border border-white/10">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm md:text-base font-bold tracking-tight">
                  Welcome, {profile?.full_name || profile?.name || "Pet Parent"}! 👋
                </h2>
                <p className="text-white/85 text-xs md:text-sm leading-relaxed">
                  I'm your dedicated Sruvo Care assistant. Ask me anything about your pet's care, bookings, products, or payment statuses!
                </p>
              </div>
            </div>
          </div>

          {/* List of Chat Bubbles */}
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div 
                  key={index} 
                  className={`flex items-start gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-100 to-pink-100 flex items-center justify-center border border-purple-200 shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4 text-[#f22c83]" />
                    </div>
                  )}

                  <div 
                    className={`max-w-[82%] text-sm font-normal leading-relaxed p-3.5 shadow-xs whitespace-pre-wrap ${
                      isAssistant 
                        ? "bg-slate-50 text-slate-800 rounded-2xl rounded-tl-none border border-slate-100" 
                        : "bg-gradient-to-r from-[#821bb3] to-[#f22c83] text-white rounded-2xl rounded-tr-none font-medium"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0 shadow-xs">
                      <User className="w-4 h-4 text-[#f22c83]" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bouncing Dots Typing Indicator */}
            {loading && (
              <div className="flex items-start gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-100 to-pink-100 flex items-center justify-center border border-purple-200 shrink-0 shadow-xs">
                  <Loader2 className="w-4 h-4 text-[#f22c83] animate-spin" />
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

        </div>

        {/* Input Bar Section */}
        <div className="bg-white border-t border-slate-100 p-3 flex gap-2 items-center flex-shrink-0 z-10 shadow-lg md:shadow-none">
          <input
            type="text"
            placeholder="Type your message here..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend(inputValue);
              }
            }}
            disabled={loading}
            id="chat-text-input"
            className="flex-1 text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-[#f22c83] focus:border-[#f22c83] focus:bg-white disabled:opacity-50 text-slate-800 font-medium placeholder-slate-400"
          />
          <Button
            size="icon"
            id="chat-send-btn"
            className="rounded-full bg-[#f22c83] hover:bg-[#d82273] active:scale-95 transition-all text-white shadow-md w-11 h-11 shrink-0 flex items-center justify-center cursor-pointer"
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || loading}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

      </main>
    </div>
  );
}

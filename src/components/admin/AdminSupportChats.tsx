import { useState, useEffect, useRef } from "react";
import { MessageSquare, Shield, Clock, Send, CheckCircle2, User, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChatThread } from "@/pages/SupportChat";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AdminSupportChats() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThreads = () => {
    try {
      const raw = localStorage.getItem("sruvo_support_chat_threads");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setThreads(parsed);
          // Sync selected thread if currently loaded
          if (selectedThread) {
            const updatedSelected = parsed.find((t) => t.id === selectedThread.id);
            if (updatedSelected) {
              setSelectedThread(updatedSelected);
            }
          }
          return;
        }
      }
    } catch (e) {}
    setThreads([]);
  };

  useEffect(() => {
    fetchThreads();
    // Poll every 1.5 seconds for active support messages
    const interval = setInterval(fetchThreads, 1500);
    return () => clearInterval(interval);
  }, [selectedThread?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThread?.messages, selectedThread]);

  const handleSendReply = () => {
    if (!selectedThread || !replyText.trim()) return;

    const updatedMessages: Message[] = [
      ...selectedThread.messages,
      { role: "assistant", content: `Support Team: ${replyText}` }
    ];

    const updatedThread: ChatThread = {
      ...selectedThread,
      messages: updatedMessages,
      lastMessage: `Support Team: ${replyText}`,
      lastActivityTimestamp: Date.now()
    };

    const allThreads = [...threads];
    const idx = allThreads.findIndex((t) => t.id === selectedThread.id);
    if (idx >= 0) {
      allThreads[idx] = updatedThread;
    } else {
      allThreads.unshift(updatedThread);
    }

    try {
      localStorage.setItem("sruvo_support_chat_threads", JSON.stringify(allThreads));
      setThreads(allThreads);
      setSelectedThread(updatedThread);
      setReplyText("");
      toast.success("Message sent successfully!");
    } catch (e) {
      toast.error("Failed to save message.");
    }
  };

  const handleEndChat = () => {
    if (!selectedThread) return;

    const endMsg: Message = {
      role: "assistant",
      content: "This support session has been resolved and closed by our support representative. Thank you for choosing Sruvo!"
    };

    const updatedMessages: Message[] = [...selectedThread.messages, endMsg];

    const updatedThread: ChatThread = {
      ...selectedThread,
      status: "ended",
      endedByHuman: true,
      messages: updatedMessages,
      lastMessage: endMsg.content,
      lastActivityTimestamp: Date.now()
    };

    const allThreads = [...threads];
    const idx = allThreads.findIndex((t) => t.id === selectedThread.id);
    if (idx >= 0) {
      allThreads[idx] = updatedThread;
    }

    try {
      localStorage.setItem("sruvo_support_chat_threads", JSON.stringify(allThreads));
      setThreads(allThreads);
      setSelectedThread(updatedThread);
      toast.success("Support session has been resolved and marked as completed!");
    } catch (e) {
      toast.error("Failed to resolve session.");
    }
  };

  const handleTakeOver = () => {
    if (!selectedThread) return;

    const takeoverMsg: Message = {
      role: "assistant",
      content: "Sruvo Support Team has taken over this consultation. Please wait a moment while we review your details..."
    };

    const updatedMessages: Message[] = [...selectedThread.messages, takeoverMsg];

    const updatedThread: ChatThread = {
      ...selectedThread,
      agentType: "human",
      messages: updatedMessages,
      lastMessage: takeoverMsg.content,
      lastActivityTimestamp: Date.now()
    };

    const allThreads = [...threads];
    const idx = allThreads.findIndex((t) => t.id === selectedThread.id);
    if (idx >= 0) {
      allThreads[idx] = updatedThread;
    }

    try {
      localStorage.setItem("sruvo_support_chat_threads", JSON.stringify(allThreads));
      setThreads(allThreads);
      setSelectedThread(updatedThread);
      toast.success("Successfully taken over support chat!");
    } catch (e) {
      toast.error("Failed to update session agent type.");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 border border-slate-200/60 rounded-2xl overflow-hidden font-sans">
      <div className="flex flex-1 overflow-hidden">
        {/* Left column: Chat List */}
        <div className="w-[320px] bg-white border-r border-slate-150 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-slate-100 shrink-0">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#5D3BF2]" />
              Support Chats ({threads.length})
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Live customer support rooms & active tickets
            </p>
          </div>

          <div className="flex-1 divide-y divide-slate-50 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-bold">No active chat sessions</p>
                <p className="text-[10px] text-slate-400 mt-1">All tickets will appear here.</p>
              </div>
            ) : (
              threads.map((t) => {
                const isSelected = selectedThread?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedThread(t)}
                    className={`p-4 cursor-pointer transition-colors flex flex-col gap-1.5 ${
                      isSelected ? "bg-slate-50/80 border-l-4 border-[#5D3BF2]" : "hover:bg-slate-50/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate max-w-[140px]">
                        {t.topic}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {t.agentType === "human" && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                            Human
                          </span>
                        )}
                        {t.status === "active" ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                            Ended
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate leading-snug">
                      {t.lastMessage}
                    </p>

                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t.date}
                      </span>
                      
                      {t.rating && (
                        <span className="flex items-center gap-0.5 font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                          <Star className="w-2.5 h-2.5 fill-amber-500 stroke-none" />
                          {t.rating}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Chat room view */}
        <div className="flex-1 bg-[#FAF9FC] flex flex-col overflow-hidden">
          {selectedThread ? (
            <>
              {/* Active Room Header */}
              <div className="bg-white border-b border-slate-100 p-4 px-6 flex items-center justify-between shrink-0">
                <div className="flex flex-col">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {selectedThread.topic}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      selectedThread.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                    }`}>
                      {selectedThread.status === "active" ? "ACTIVE SESSION" : "RESOLVED & ENDED"}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>Thread ID: {selectedThread.id}</span>
                    <span>•</span>
                    <span className="text-slate-500 font-semibold flex items-center gap-1 uppercase">
                      Agent: {selectedThread.agentType || "ai"}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedThread.status === "active" && selectedThread.agentType !== "human" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTakeOver}
                      className="text-xs font-bold border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-50 rounded-xl"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      Take Over as Human
                    </Button>
                  )}
                  
                  {selectedThread.status === "active" && (
                    <Button
                      size="sm"
                      onClick={handleEndChat}
                      className="text-xs font-bold bg-[#f22c83] hover:bg-[#d82273] text-white rounded-xl shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Resolve &amp; End Chat
                    </Button>
                  )}
                </div>
              </div>

              {/* Message log */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedThread.messages.map((m, idx) => {
                  const isAgent = m.role === "assistant";
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 ${isAgent ? "justify-end" : "justify-start"}`}
                    >
                      {!isAgent && (
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-[#5D3BF2]" />
                        </div>
                      )}

                      <div className="flex flex-col max-w-[70%]">
                        <div
                          className={`p-3.5 rounded-2xl shadow-xs text-xs whitespace-pre-wrap ${
                            isAgent
                              ? "bg-gradient-to-r from-[#821bb3] to-[#f22c83] text-white rounded-tr-none font-medium"
                              : "bg-white text-slate-800 rounded-tl-none border border-slate-150"
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 self-end px-1">
                          {isAgent ? "Support Agent" : "Client User"}
                        </span>
                      </div>

                      {isAgent && (
                        <div className="w-8 h-8 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4 text-[#f22c83]" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply viewport */}
              {selectedThread.status === "active" ? (
                <div className="bg-white border-t border-slate-100 p-4 px-6 flex items-center gap-3 shrink-0">
                  <input
                    type="text"
                    placeholder={
                      selectedThread.agentType === "human"
                        ? "Type your message as Sruvo Support representative..."
                        : "Take over as human first to send messages directly..."
                    }
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendReply();
                    }}
                    disabled={selectedThread.agentType !== "human"}
                    className="flex-1 text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-[#f22c83] focus:border-[#f22c83] focus:bg-white disabled:opacity-60 text-slate-800 placeholder-slate-400 font-medium"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || selectedThread.agentType !== "human"}
                    className="rounded-full bg-[#f22c83] hover:bg-[#d82273] text-white w-10 h-10 shrink-0 flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="bg-slate-100 border-t border-slate-200 p-4 px-6 text-center text-slate-500 shrink-0 text-xs font-semibold flex items-center justify-center gap-2">
                  <span>🔒 This ticket has been resolved and closed.</span>
                  {selectedThread.rating && (
                    <span className="flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full shrink-0 font-bold uppercase tracking-wider text-[10px]">
                      Rated: {selectedThread.rating} Stars
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-200 mb-2.5" />
              <h4 className="text-sm font-bold text-slate-700">No Chat Selected</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                Choose a customer consultation thread from the sidebar to review the message log, chat in real-time, or resolve their case.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

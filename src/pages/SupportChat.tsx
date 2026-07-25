import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  ArrowLeft, Send, Sparkles, AlertCircle,
  Calendar, ShoppingBag, CreditCard, Shield, Loader2, User,
  ChevronRight, Headphones, Wallet, Stethoscope, Truck, Tag, 
  Heart, MapPin, MessageSquare, FileText, HelpCircle, MessageCircle,
  Lock, Clock, Star, X, Frown, Meh, Smile, ThumbsUp
} from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import sruvoHelpMascots from "@/assets/images/sruvo_help_mascots_1784534077052.jpg";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatThread {
  id: string;
  topic: string;
  date: string;
  status: "ended" | "active";
  lastActivityTimestamp?: number;
  lastMessage: string;
  messages: Message[];
  agentType?: "ai" | "human";
  endedByHuman?: boolean;
  rating?: number;
  ratingComment?: string;
}

const DEFAULT_CHAT_THREADS: ChatThread[] = [
  {
    id: "thread_301",
    topic: "Payments & Refunds",
    date: "24 Jul 2026, 09:30 AM",
    status: "ended",
    lastMessage: "Your refund of ₹350 for appointment #SRV-84721 has been processed and credited to your original payment source.",
    messages: [
      { role: "user", content: "I have payment and refund related issues for my consultation booking." },
      { role: "assistant", content: "Hello! I am checking your recent consultation payment for appointment #SRV-84721. Your payment of ₹350 was received successfully." },
      { role: "user", content: "I want to request a refund as I need to reschedule." },
      { role: "assistant", content: "Your refund request has been logged. The amount of ₹350 will be credited back to your original payment method within 24-48 hours. This support thread is now marked as completed." }
    ]
  },
  {
    id: "thread_302",
    topic: "Smart Match & Vet Consultation",
    date: "22 Jul 2026, 04:15 PM",
    status: "ended",
    lastMessage: "Glad I could assist you with your vet booking details! Have a great day with Jimmy.",
    messages: [
      { role: "user", content: "I need help with my vet consultation booking and Smart Match." },
      { role: "assistant", content: "Sure! Smart Match paired your pet Jimmy (Dog) with Dr. Ananya Sharma based on reported symptoms of skin itching and loss of appetite." },
      { role: "user", content: "Can I view the doctor's prescription directly in the app?" },
      { role: "assistant", content: "Yes! Once Dr. Ananya Sharma completes the live video call, your digital prescription will appear automatically under Pet Passport & Past Consultations." }
    ]
  },
  {
    id: "thread_303",
    topic: "Shop Orders & Delivery",
    date: "18 Jul 2026, 02:45 PM",
    status: "ended",
    lastMessage: "Your order #ORD-9821 has been dispatched with BlueDart tracking ID #BD889201.",
    messages: [
      { role: "user", content: "Where is my shop order for Pedigree Puppy Food?" },
      { role: "assistant", content: "Let me fetch your order status. Order #ORD-9821 (Pedigree Puppy Food 3kg) is currently out for delivery with our courier partner." },
      { role: "user", content: "What is the expected delivery time?" },
      { role: "assistant", content: "It is scheduled to be delivered by 6:00 PM today. Tracking link has been sent to your registered SMS number." }
    ]
  }
];

const getStoredThreads = (): ChatThread[] => {
  const INACTIVITY_TIMEOUT_MS = (4 * 60 + 49) * 1000;
  let list: ChatThread[] = [];
  try {
    const raw = localStorage.getItem("sruvo_support_chat_threads");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
    }
  } catch (e) {}

  if (!list || list.length === 0) {
    list = DEFAULT_CHAT_THREADS;
  }

  // Check dynamic status for active threads based on 4m 49s inactivity
  const now = Date.now();
  let modified = false;

  list.forEach(t => {
    if (t.status === "active" && t.agentType !== "human") {
      const lastTs = t.lastActivityTimestamp || 0;
      if (now - lastTs >= INACTIVITY_TIMEOUT_MS) {
        t.status = "ended";
        modified = true;
        if (t.messages && t.messages.length > 0) {
          const lastMsg = t.messages[t.messages.length - 1];
          if (lastMsg && !lastMsg.content.includes("Since you have not responded to our message")) {
            t.messages.push({
              role: "assistant",
              content: "Since you have not responded to our message, we are closing this ticket. If you need any further support, please feel free to raise a new ticket and we will help you. Have a wonderful day!"
            });
            t.lastMessage = t.messages[t.messages.length - 1].content;
          }
        }
      }
    }
  });

  if (modified) {
    try {
      localStorage.setItem("sruvo_support_chat_threads", JSON.stringify(list));
    } catch(e) {}
  }

  return list;
};

const getRandomGreeting = (userName?: string): string => {
  const namePart = userName ? ` ${userName}` : "";
  const greetings = [
    `Hello${namePart}. I am the Sruvo Care Assistant. I am here to help you resolve any issues regarding your vet consultations, Smart Match bookings, payments, refunds, or pet passports. How can I assist you today?`,
    `Welcome${namePart}. This is Sruvo Support. Please let me know how I can help you with your vet consultations, Smart Match bookings, billing, refunds, or pet passports. I am ready to assist you.`,
    `Hello${namePart}. You are connected with the Sruvo Care Assistant. I can help resolve any queries about your bookings, vet consultations, payments, refunds, or pet passports. Please let me know what issue you are experiencing.`,
    `Hi${namePart}. I am the Sruvo Support Representative. I am here to help you manage or resolve issues related to your consultations, Smart Match bookings, payments, refunds, or pet passports. How may I help you today?`
  ];
  const randIdx = Math.floor(Math.random() * greetings.length);
  return greetings[randIdx];
};

const parseMessageOptions = (content: string, isFirstMsgOfGeneralSupport: boolean): { text: string; options: string[] } => {
  if (isFirstMsgOfGeneralSupport) {
    const generalGreetingText = "Hey! I'm Jira, Sruvo's AI Support Assistant.\nHow can I help you today?";
    if (content !== generalGreetingText) {
      return { text: content, options: [] };
    }
    return {
      text: generalGreetingText,
      options: [
        "I have an order related issue",
        "I need help with a consultation",
        "I have a payment or refund issue",
        "My issue is something else"
      ]
    };
  }

  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
  const options: string[] = [];
  let i = lines.length - 1;
  
  const contentLower = content.toLowerCase();
  const hasOptionIndicator = contentLower.includes("choose") || 
                             contentLower.includes("option") || 
                             contentLower.includes("select") || 
                             contentLower.includes("following") ||
                             contentLower.includes("click") ||
                             contentLower.includes("type") ||
                             contentLower.includes("below") ||
                             contentLower.includes("specialist");

  if (!hasOptionIndicator) {
    return { text: content, options: [] };
  }

  while (i >= 0) {
    const line = lines[i];
    const isOption = line.length > 0 && 
                     line.length < 50 && 
                     !line.endsWith(".") && 
                     !line.endsWith("?") && 
                     !line.endsWith("!") && 
                     !line.startsWith("-") && 
                     !line.startsWith("*") &&
                     !line.match(/^\d+\./);

    const isCommonOption = ["refund status", "payment failed", "incorrect charge", "wallet issue", "other", "others", "yes", "no"].includes(line.toLowerCase().trim());

    if (isOption || isCommonOption) {
      options.unshift(line);
      i--;
    } else {
      break;
    }
  }

  if (options.length >= 2) {
    const textLines = lines.slice(0, i + 1);
    return {
      text: textLines.join("\n"),
      options
    };
  }

  return { text: content, options: [] };
};

export default function SupportChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  
  const [view, setView] = useState<"help" | "chat" | "threads">(
    location.pathname === "/buyer/support/chat" ? "chat" : "help"
  );

  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [isEndedThread, setIsEndedThread] = useState<boolean>(false);
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPaymentRefund, setIsPaymentRefund] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragControls = useDragControls();
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const thinkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const threadId = params.get("threadId");
    const isNewChat = params.get("newChat") === "true";
    const flow = params.get("flow");
    const isPaymentRefundFlow = flow === "payment_refund" || localStorage.getItem("sruvo_payment_refund_flow_active") === "true";
    setIsPaymentRefund(isPaymentRefundFlow);

    if (threadId) {
      const threads = getStoredThreads();
      const found = threads.find(t => t.id === threadId);
      if (found) {
        setActiveThread(found);
        setMessages(found.messages);
        setIsEndedThread(found.status === "ended");
        setView("chat");
        if (found.status === "ended" && !found.rating) {
          setShowRatingModal(true);
        } else {
          setShowRatingModal(false);
        }
        return;
      }
    }

    if (location.pathname === "/buyer/support/chat") {
      setView("chat");
      const threads = getStoredThreads();
      const activeUserThread = threads.find(t => t.id === "active_user_thread");

      if (isNewChat || !activeUserThread || activeUserThread.status === "ended") {
        if (activeUserThread) {
          const archivedId = "thread_archive_" + Date.now();
          const existingIdx = threads.findIndex(t => t.id === "active_user_thread");
          if (existingIdx >= 0) {
            threads[existingIdx] = { ...activeUserThread, id: archivedId };
          }
          try {
            localStorage.setItem("sruvo_support_chat_threads", JSON.stringify(threads));
          } catch(e) {}
        }

        let topicName = "General Support Query";

        // Clean up any existing intervals/timeouts
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);

        setIsEndedThread(false);

        const name = profile?.full_name || profile?.name || "";
        const greetingText = getRandomGreeting(name);

        if (isPaymentRefundFlow) {
          topicName = "Payment & Refund Issue";
          let apptInfo: any = null;
          try {
            const apptRaw = localStorage.getItem("sruvo_payment_refund_flow_appt");
            if (apptRaw) {
              apptInfo = JSON.parse(apptRaw);
            }
          } catch (e) {}

          const userEmailOrPhone = profile?.email || profile?.phone || "jashanpabla6691@gmail.com";
          const rawBookingId = apptInfo?.id || "84721";
          const bookingId = typeof rawBookingId === "string" && rawBookingId.length > 8
            ? rawBookingId.slice(0, 5).toUpperCase()
            : rawBookingId;
          const petName = apptInfo?.pet_name || apptInfo?.petName || "Bella";
          const petBreed = apptInfo?.pet_breed || apptInfo?.petBreed || "Golden Retriever";
          const amount = apptInfo?.amount || 350;

          const detailedResponse = `I am ready to help you resolve this issue immediately.

Since you navigated directly from your recent consultation card, I have automatically retrieved your transaction details:

1. **Registered Email/Mobile:** ${userEmailOrPhone}
2. **Booking ID or Order ID:** #SRV-${bookingId} (Amount: ₹${amount})
3. **Pet Details:** ${petName} (${petBreed})

Our system verifies that your payment of ₹${amount} was successful. A refund of ₹${amount} has been initiated back to your original payment method. The refund will reflect in your account within 2-3 business days. Reference RRN is 502353742945.`;

          // Clear active flags
          localStorage.removeItem("sruvo_payment_refund_flow_active");

          const baseMessages = [
            { role: "assistant" as const, content: greetingText },
            { role: "user" as const, content: "I have payment and refund related issues with my consultation." }
          ];
          setMessages(baseMessages);
          setLoading(true);

          thinkingTimeoutRef.current = setTimeout(() => {
            const words = detailedResponse.split(" ");
            let currentIdx = 0;
            let currentText = "";

            typingIntervalRef.current = setInterval(() => {
              if (currentIdx < words.length) {
                currentText += (currentIdx === 0 ? "" : " ") + words[currentIdx];
                setMessages([...baseMessages, { role: "assistant" as const, content: currentText }]);
                currentIdx++;
              } else {
                if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
                setLoading(false);
                const finalMsgs = [...baseMessages, { role: "assistant" as const, content: detailedResponse }];
                saveCurrentChatToThreads(finalMsgs, "Payment & Refund Issue", "active");
              }
            }, 20);
          }, 1200);

          const freshThread: ChatThread = {
            id: "active_user_thread",
            topic: topicName,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: "active",
            lastActivityTimestamp: Date.now(),
            lastMessage: detailedResponse,
            messages: [
              ...baseMessages,
              { role: "assistant", content: detailedResponse }
            ]
          };
          setActiveThread(freshThread);

        } else {
          setMessages([]);
          setLoading(true);

          const generalGreetingText = "Hey! I'm Jira, Sruvo's AI Support Assistant.\nHow can I help you today?";

          thinkingTimeoutRef.current = setTimeout(() => {
            const words = generalGreetingText.split(" ");
            let currentIdx = 0;
            let currentText = "";

            typingIntervalRef.current = setInterval(() => {
              if (currentIdx < words.length) {
                currentText += (currentIdx === 0 ? "" : " ") + words[currentIdx];
                setMessages([{ role: "assistant" as const, content: currentText }]);
                currentIdx++;
              } else {
                if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
                setLoading(false);
                const finalMsgs = [{ role: "assistant" as const, content: generalGreetingText }];
                saveCurrentChatToThreads(finalMsgs, "General Support Query", "active");
              }
            }, 25);
          }, 1200);

          const freshThread: ChatThread = {
            id: "active_user_thread",
            topic: topicName,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: "active",
            lastActivityTimestamp: Date.now(),
            lastMessage: generalGreetingText,
            messages: [{ role: "assistant", content: generalGreetingText }]
          };
          setActiveThread(freshThread);
        }
      } else {
        setActiveThread(activeUserThread);
        setMessages(activeUserThread.messages);
        setIsEndedThread(false);
      }
    } else {
      setView("help");
      setIsEndedThread(false);
      setActiveThread(null);
    }
  }, [location.pathname, location.search, profile]);

  // Auto-scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Poll local storage for updates to the active thread (such as human agent messages or ended status)
  useEffect(() => {
    if (view !== "chat" || isEndedThread) return;

    const interval = setInterval(() => {
      const threads = getStoredThreads();
      const currentId = activeThread?.id || "active_user_thread";
      const found = threads.find(t => t.id === currentId);
      
      if (found) {
        // If there are more messages, update messages state
        if (found.messages && found.messages.length !== messages.length) {
          setMessages(found.messages);
        }
        
        // If the agentType changed on storage, update our activeThread state
        if (found.agentType !== activeThread?.agentType) {
          setActiveThread(prev => prev ? { ...prev, agentType: found.agentType } : found);
        }
        
        // If the status has changed to ended
        if (found.status === "ended") {
          setIsEndedThread(true);
          setActiveThread(prev => prev ? { ...prev, status: "ended", endedByHuman: found.endedByHuman } : found);
          
          if (found.endedByHuman) {
            // Trigger the rating popup!
            setShowRatingModal(true);
          }
        }
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [view, isEndedThread, messages.length, activeThread?.id, activeThread?.agentType]);

  useEffect(() => {
    if (view === "chat") {
      scrollToBottom();
    }
  }, [messages, loading, view]);

  const saveCurrentChatToThreads = (
    updatedMsgs: Message[], 
    topicTitle?: string, 
    forcedStatus?: "ended" | "active"
  ) => {
    const threads = getStoredThreads();
    const currentTopic = topicTitle || "General Support Query";
    const existingIndex = threads.findIndex(t => t.id === "active_user_thread");
    const lastMsg = updatedMsgs[updatedMsgs.length - 1]?.content || "";
    const now = Date.now();

    const finalStatus: "active" | "ended" = forcedStatus ? forcedStatus : "active";
    const existingThread = existingIndex >= 0 ? threads[existingIndex] : null;
    const finalAgentType = existingThread?.agentType || "ai";
    const finalEndedByHuman = existingThread?.endedByHuman || false;
    const finalRating = existingThread?.rating;
    const finalRatingComment = existingThread?.ratingComment;

    const newOrUpdatedThread: ChatThread = {
      id: "active_user_thread",
      topic: currentTopic,
      date: existingThread?.date || (new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })),
      status: finalStatus,
      lastActivityTimestamp: now,
      lastMessage: lastMsg,
      messages: updatedMsgs,
      agentType: finalAgentType,
      endedByHuman: finalEndedByHuman,
      rating: finalRating,
      ratingComment: finalRatingComment
    };

    if (existingIndex >= 0) {
      threads[existingIndex] = newOrUpdatedThread;
    } else {
      threads.unshift(newOrUpdatedThread);
    }

    try {
      localStorage.setItem("sruvo_support_chat_threads", JSON.stringify(threads));
    } catch(e) {}
  };

  const connectToHumanAgent = () => {
    if (isEndedThread) return;

    setLoading(true);
    
    // 1. Add connection system message
    const connMsg: Message = {
      role: "assistant",
      content: "Connecting you to the Sruvo Support Team (Human Representative)... Please wait."
    };

    const updatedMsgs = [...messages, connMsg];
    setMessages(updatedMsgs);

    // Save initial connecting status to local storage
    const threads = getStoredThreads();
    const existingIndex = threads.findIndex(t => t.id === "active_user_thread");
    if (existingIndex >= 0) {
      threads[existingIndex].agentType = "human";
      threads[existingIndex].messages = updatedMsgs;
      threads[existingIndex].lastMessage = connMsg.content;
      localStorage.setItem("sruvo_support_chat_threads", JSON.stringify(threads));
    }

    setTimeout(() => {
      const joinMsg: Message = {
        role: "assistant",
        content: "Hi, I am Rajesh from Sruvo Support Team. I've joined the conversation. How can I help you resolve this issue today?\n\n(Note: The 9-minute auto-close timer has been disabled for this session.)"
      };
      
      setMessages(prev => {
        const finalMsgs = [...prev, joinMsg];
        
        // Update local storage
        const currentThreads = getStoredThreads();
        const idx = currentThreads.findIndex(t => t.id === "active_user_thread");
        if (idx >= 0) {
          currentThreads[idx].agentType = "human";
          currentThreads[idx].messages = finalMsgs;
          currentThreads[idx].lastMessage = joinMsg.content;
          currentThreads[idx].lastActivityTimestamp = Date.now();
          localStorage.setItem("sruvo_support_chat_threads", JSON.stringify(currentThreads));
        }

        // Update activeThread state
        if (activeThread) {
          setActiveThread({
            ...activeThread,
            agentType: "human",
            messages: finalMsgs,
            lastMessage: joinMsg.content,
            lastActivityTimestamp: Date.now()
          });
        }
        
        return finalMsgs;
      });

      setLoading(false);
      toast.success("Connected to Sruvo Support Team!");
    }, 1200);
  };

  const handleSubmitRating = () => {
    const threads = getStoredThreads();
    const currentId = activeThread?.id || "active_user_thread";
    const existingIndex = threads.findIndex(t => t.id === currentId);
    
    if (existingIndex >= 0) {
      threads[existingIndex].rating = selectedRating;
      threads[existingIndex].ratingComment = ratingComment;
      localStorage.setItem("sruvo_support_chat_threads", JSON.stringify(threads));
      
      // Update activeThread state
      if (activeThread) {
        setActiveThread({
          ...activeThread,
          rating: selectedRating,
          ratingComment: ratingComment
        });
      }
    }
    
    setShowRatingModal(false);
    toast.success("Thank you for your rating!");
  };

  // Internal Inactivity Auto-Close Timer (4 minutes 49 seconds = 289,000 ms)
  // No visible countdown or timer displayed on UI
  useEffect(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    if (view === "chat" && !isEndedThread && messages.length > 0 && activeThread?.agentType !== "human") {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant" && !loading) {
        const INACTIVITY_TIMEOUT_MS = (4 * 60 + 49) * 1000; // 289,000 ms
        const lastTs = activeThread?.lastActivityTimestamp || Date.now();
        const elapsed = Date.now() - lastTs;
        const remaining = Math.max(0, INACTIVITY_TIMEOUT_MS - elapsed);

        inactivityTimerRef.current = setTimeout(() => {
          const autoCloseMsg: Message = {
            role: "assistant",
            content: "Since you have not responded to our message, we are closing this ticket. If you need any further support, please feel free to raise a new ticket and we will help you. Have a wonderful day!"
          };

          setMessages(prev => {
            const finalMsgs = [...prev, autoCloseMsg];
            saveCurrentChatToThreads(finalMsgs, activeThread?.topic || "General Support Query", "ended");
            return finalMsgs;
          });

          setIsEndedThread(true);
        }, remaining);
      }
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [view, isEndedThread, messages, loading, activeThread?.lastActivityTimestamp]);

  const handleSend = async (text: string) => {
    if (isEndedThread) {
      toast.error("This consultation has already ended. You cannot send new messages.");
      return;
    }

    if (!text.trim() || loading) return;

    const lowerText = text.toLowerCase().trim();
    if (lowerText === "human" || lowerText === "agent" || lowerText === "representative" || lowerText.includes("talk to human") || lowerText.includes("connect to human")) {
      setInputValue("");
      connectToHumanAgent();
      return;
    }

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInputValue("");
    setLoading(true);
    saveCurrentChatToThreads(updatedMessages, activeThread?.topic || "General Support Query", "active");

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
          currentPath: location.pathname
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach Sruvo support API");
      }

      const data = await response.json();
      if (data.response) {
        const finalMsgs: Message[] = [...updatedMessages, { role: "assistant", content: data.response }];
        setMessages(finalMsgs);
        saveCurrentChatToThreads(finalMsgs, activeThread?.topic || "General Support Query", "active");
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
    navigate("/buyer/support/chat?newChat=true");
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
        <header className="bg-[#FAF9FC] px-5 md:px-8 py-5 flex-shrink-0">
          <div className="max-w-5xl mx-auto flex items-start justify-between">
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
                <h1 className="text-[22px] md:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  Help &amp; Support
                </h1>
                <p className="text-xs md:text-sm text-[#7E8594] font-medium tracking-tight mt-1.5 max-w-[90%] leading-relaxed">
                  Get support for pet care, orders, payments, and everything on Sruvo.
                </p>
              </div>
            </div>
            
            {/* Circular Sruvo AI Headset Icon */}
            <div 
              onClick={() => navigate("/buyer/support/chat?newChat=true")}
              className="w-11 h-11 rounded-full bg-[#5D3BF2] flex items-center justify-center shrink-0 cursor-pointer shadow-[0_3px_10px_rgba(93,59,242,0.18)] hover:scale-105 active:scale-95 transition-all text-white"
            >
              <Headphones className="w-5 h-5" strokeWidth={2.2} />
            </div>
          </div>
        </header>

        {/* MAIN BODY SCROLLABLE AREA */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-5 md:px-8 py-2 space-y-6">
          
          {/* TOP CARD: REFUND SUMMARY CARD WITH ILLUSTRATION */}
          <div 
            onClick={() => handleItemClick("Payments & Refunds", "Show my active refunds status.")}
            className="bg-gradient-to-r from-[#FFF5F1] to-[#FFFBF9] border border-[#FFE7DD]/80 rounded-[24px] p-5 md:p-6 pr-32 md:pr-48 flex items-center justify-between relative overflow-hidden shadow-[0_2px_12px_rgba(253,92,34,0.04)] cursor-pointer hover:border-[#FFA585] transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-4 relative z-10">
              {/* Wallet Icon in white circle */}
              <div className="w-14 h-14 rounded-full bg-white border border-[#FFF0EA] flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(255,91,34,0.06)]">
                <Wallet className="w-6 h-6 text-[#FF5B22]" strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-[15px] md:text-[17px] font-bold text-slate-800 leading-snug">
                  You have 0 active refunds
                </h2>
                <div className="flex items-center gap-1 text-sm font-bold text-[#FF5B22] mt-1 hover:opacity-90 transition-opacity">
                  <span>View My Refunds</span>
                  <ChevronRight className="w-4 h-4 mt-0.5" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Puppy & Kitten Illustration sitting on the right edge */}
            <div className="absolute right-2.5 bottom-0 w-32 md:w-40 h-[82px] md:h-[96px] overflow-hidden pointer-events-none flex items-end justify-end">
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
            <h3 className="text-[11px] md:text-xs font-bold text-[#7E8594] tracking-wider mb-2.5 uppercase px-1">
              RECENT
            </h3>
            <div 
              onClick={() => handleItemClick("Issues with Recent Orders", "I have an issue with my recent shop order.")}
              className="bg-white rounded-[20px] border border-[#E9ECF0] p-4.5 md:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 active:scale-[0.99] transition-all shadow-[0_2px_8px_rgba(26,28,30,0.015)]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#F3EFFF] flex items-center justify-center text-[#5D3BF2] shrink-0">
                  <ShoppingBag className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] md:text-base text-[#1A1C1E] leading-snug">
                    Issues with Recent Orders
                  </span>
                  <span className="text-xs md:text-sm text-[#7E8594] mt-0.5 font-medium">
                    Get help with your pet shop orders
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#B2B9C5]" strokeWidth={2} />
            </div>
          </div>

          {/* HELP WITH OTHER QUERIES SECTION */}
          <div>
            <h3 className="text-[11px] md:text-xs font-bold text-[#7E8594] tracking-wider mb-2.5 uppercase px-1">
              HELP WITH OTHER QUERIES
            </h3>
            <div className="flex flex-col gap-3 md:gap-3.5 w-full">
              {otherQueries.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => handleItemClick(item.title, item.query)}
                    className="bg-white rounded-[20px] border border-[#E9ECF0] p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 active:scale-[0.99] transition-colors shadow-[0_2px_8px_rgba(26,28,30,0.015)]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#F3EFFF] flex items-center justify-center text-[#5D3BF2] shrink-0">
                        <Icon className="w-5 h-5" strokeWidth={2.2} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[15px] text-[#1A1C1E] leading-snug">
                          {item.title}
                        </span>
                        <span className="text-xs text-[#7E8594] mt-0.5 font-medium leading-tight">
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
            <h3 className="text-[11px] md:text-xs font-bold text-[#7E8594] tracking-wider mb-2.5 uppercase px-1">
              CONVERSATION ARCHIVES
            </h3>
            <div 
              onClick={() => {
                setView("threads");
              }}
              className="bg-white rounded-[20px] border border-[#E9ECF0] p-4.5 md:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 active:scale-[0.99] transition-all shadow-[0_2px_8px_rgba(26,28,30,0.015)]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#F3EFFF] flex items-center justify-center text-[#5D3BF2] shrink-0">
                  <MessageSquare className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] md:text-base text-[#1A1C1E] leading-snug">
                    All conversation threads
                  </span>
                  <span className="text-xs md:text-sm text-[#7E8594] mt-0.5 font-medium">
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

  // Render All Conversation Threads Screen
  if (view === "threads") {
    const threads = getStoredThreads();
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-10">
        <header className="bg-white border-b border-[#E9ECF0] px-4 py-3.5 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-slate-100 transition-colors w-9 h-9"
              onClick={() => setView("help")}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Help & Support</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto w-full px-4 pt-5 space-y-4">
          <h2 className="text-[11px] md:text-xs font-bold text-[#7E8594] tracking-wider uppercase px-1">
            ALL CONVERSATION THREADS
          </h2>

          <div className="flex flex-col gap-3 w-full">
            {threads.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No conversation threads found</p>
                <p className="text-xs text-slate-500 mt-1">Your past AI support chats will appear here.</p>
              </div>
            ) : (
              threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => {
                    setActiveThread(thread);
                    setMessages(thread.messages);
                    setIsEndedThread(thread.status === "ended");
                    setView("chat");
                    if (thread.status === "ended" && !thread.rating) {
                      setShowRatingModal(true);
                    } else {
                      setShowRatingModal(false);
                    }
                    navigate(`/buyer/support/chat?threadId=${thread.id}`);
                  }}
                  className="bg-white rounded-[20px] border border-[#E9ECF0] p-4.5 md:p-5 flex flex-col gap-2.5 cursor-pointer hover:bg-slate-50/80 active:scale-[0.99] transition-all shadow-[0_2px_8px_rgba(26,28,30,0.015)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[15px] md:text-base text-[#1A1C1E] leading-snug">
                      {thread.topic}
                    </span>
                    {thread.status === "active" ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                        ENDED
                      </span>
                    )}
                  </div>

                  <p className="text-xs md:text-sm text-[#7E8594] font-normal line-clamp-2 leading-relaxed">
                    {thread.lastMessage || "Conversation completed."}
                  </p>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-1">
                    <span className="text-[11px] md:text-xs font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {thread.date}
                    </span>
                    <span className="text-xs font-semibold text-[#5D3BF2] flex items-center gap-1">
                      View Chat <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    );
  }

  // Dynamic satisfaction state helper
  const getRatingFeedback = (rating: number) => {
    switch (rating) {
      case 1:
        return {
          label: "Disappointed",
          color: "text-rose-500 bg-rose-50 border-rose-100",
          icon: <Frown className="w-8 h-8 text-rose-500" strokeWidth={1.5} />
        };
      case 2:
        return {
          label: "Could be better",
          color: "text-orange-500 bg-orange-50 border-orange-100",
          icon: <Frown className="w-8 h-8 text-orange-500" strokeWidth={1.5} />
        };
      case 3:
        return {
          label: "Satisfactory",
          color: "text-amber-500 bg-amber-50 border-amber-100",
          icon: <Meh className="w-8 h-8 text-amber-500" strokeWidth={1.5} />
        };
      case 4:
        return {
          label: "Good support",
          color: "text-emerald-500 bg-emerald-50 border-emerald-100",
          icon: <Smile className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
        };
      case 5:
      default:
        return {
          label: "Exceptional assistance!",
          color: "text-[#f22c83] bg-[#fdf2f7] border-[#fcdceb]",
          icon: <Sparkles className="w-8 h-8 text-[#f22c83]" strokeWidth={1.5} />
        };
    }
  };

  const ratingFeedback = getRatingFeedback(selectedRating);
  const isAIAgent = activeThread?.agentType === "ai" || !activeThread?.agentType;
  const agentName = isAIAgent ? "Sruvo Care AI Assistant" : "Rajesh";
  const topicName = activeThread?.topic || "General Support Query";
  const dateStr = activeThread?.date ? `on ${activeThread.date}` : "";

  // Render Interactive Chat UI (when view === "chat")
  return (
    <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col font-sans overflow-hidden w-full h-[100dvh]">
      {/* Sruvo Premium Support Header - FIXED / STICKY AT TOP */}
      <header className="shrink-0 bg-white border-b border-gray-200 shadow-xs z-30">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              id="back-to-help-btn"
              className="rounded-full hover:bg-slate-100 transition-colors w-9 h-9"
              onClick={() => navigate("/buyer/support")}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <div>
              <h1 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                {activeThread?.topic || "Sruvo Help Center"}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
                  isEndedThread 
                    ? "bg-slate-100 text-slate-500 border border-slate-200" 
                    : activeThread?.agentType === "human"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-[#f22c83]/10 text-[#f22c83] border border-[#f22c83]/10"
                }`}>
                  {isEndedThread 
                    ? "Ended" 
                    : activeThread?.agentType === "human"
                      ? "Human Agent Support"
                      : "AI Support"
                  }
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isEndedThread ? "bg-slate-400" : "bg-emerald-500 animate-pulse"}`}></span>
                {isEndedThread 
                  ? "Consultation completed" 
                  : activeThread?.agentType === "human"
                    ? "Rajesh is typing..."
                    : "We are online & ready to help"
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0 shadow-xs">
              {profile?.photo ? (
                <img src={profile.photo} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-sm font-semibold text-purple-700">{getInitial()}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Interactive Support Chat Container */}
      <main className="flex-1 flex flex-col min-h-0 max-w-5xl mx-auto w-full bg-white border-x border-gray-100 relative md:rounded-2xl md:my-2 md:border overflow-hidden">
        
        {/* Messages List Area - ONLY THIS SCROLLS */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          
          {/* Read-Only Ended Consultation Banner */}
          {isEndedThread && (
            <div className="flex flex-col gap-3.5 mb-4">
              <div className="bg-slate-100 border border-slate-200/80 rounded-xl p-3 px-4 text-xs font-medium text-slate-700 flex items-center justify-between gap-2 shrink-0 shadow-xs">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  This consultation has ended. You are viewing a read-only conversation thread.
                </span>
                <span className="text-[10px] bg-slate-200 px-2.5 py-0.5 rounded-full font-bold text-slate-700 shrink-0 uppercase tracking-wider">
                  ENDED
                </span>
              </div>
              
              {activeThread?.rating && (
                <div className="bg-amber-50/50 border border-amber-100/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 stroke-amber-500 text-amber-500" />
                      Your Support Rating
                    </p>
                    {activeThread.ratingComment && (
                      <p className="text-[11px] text-slate-500 italic">"{activeThread.ratingComment}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (activeThread.rating || 0)
                            ? "fill-amber-400 stroke-amber-500 text-amber-500"
                            : "text-slate-200 fill-none"
                        }`}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Brand Welcome Banner */}
          {!isEndedThread && (
            <div className="bg-gradient-to-r from-purple-900 via-[#821bb3] to-[#f22c83] rounded-2xl p-5 md:p-6 text-white shadow-sm mb-4 relative overflow-hidden">
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
          )}

          {/* List of Chat Bubbles */}
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === "assistant";
              const isFirstMsgOfGeneralSupport = !isPaymentRefund && index === 0;
              const { text, options } = parseMessageOptions(msg.content, isFirstMsgOfGeneralSupport);

              return (
                <div key={index} className="space-y-3">
                  <div className={`flex items-start gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}>
                    {isAssistant && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-100 to-pink-100 flex items-center justify-center border border-purple-200 shrink-0 shadow-xs">
                        <Sparkles className="w-4 h-4 text-[#f22c83]" />
                      </div>
                    )}

                    <div 
                      className={`max-w-[85%] md:max-w-[70%] text-sm font-normal leading-relaxed p-3.5 md:p-4 shadow-xs whitespace-pre-wrap ${
                        isAssistant 
                          ? "bg-slate-50 text-slate-800 rounded-2xl rounded-tl-none border border-slate-100" 
                          : "bg-gradient-to-r from-[#821bb3] to-[#f22c83] text-white rounded-2xl rounded-tr-none font-medium"
                      }`}
                    >
                      {text}
                    </div>

                    {!isAssistant && (
                      <div className="w-8 h-8 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0 shadow-xs">
                        <User className="w-4 h-4 text-[#f22c83]" />
                      </div>
                    )}
                  </div>

                  {/* Quick Option Cards rendered below the bubble if it is the last message & active thread */}
                  {isAssistant && options.length > 0 && index === messages.length - 1 && !isEndedThread && (
                    <motion.div 
                      variants={{
                        hidden: { opacity: 1 },
                        visible: {
                          transition: {
                            staggerChildren: 0.08,
                            delayChildren: 0.08
                          }
                        }
                      }}
                      initial="hidden"
                      animate="visible"
                      className="pl-11 pr-4 py-1 flex flex-col gap-2.5 max-w-[85%] md:max-w-[70%]"
                    >
                      {options.map((opt, oIdx) => (
                        <motion.button
                          variants={{
                            hidden: { opacity: 0, y: 15 },
                            visible: { 
                              opacity: 1, 
                              y: 0, 
                              transition: { 
                                type: "spring", 
                                stiffness: 220, 
                                damping: 20 
                              } 
                            }
                          }}
                          key={oIdx}
                          onClick={() => {
                            handleSend(opt);
                            if (opt === "My issue is something else") {
                              setTimeout(() => {
                                const inputEl = document.getElementById("chat-text-input");
                                if (inputEl) {
                                  inputEl.focus();
                                }
                              }, 350);
                            }
                          }}
                          disabled={loading}
                          className="w-full text-left bg-white hover:bg-[#fdf2f7] active:scale-[0.985] transition-all border border-[#E9ECF0] hover:border-[#fcdceb] rounded-[18px] py-3.5 px-5 font-bold text-[#821bb3] hover:text-[#f22c83] shadow-xs cursor-pointer text-xs md:text-sm leading-snug block"
                        >
                          {opt}
                        </motion.button>
                      ))}
                    </motion.div>
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

        {/* Input Bar Section - FIXED / STICKY AT BOTTOM */}
        {isEndedThread ? (
          <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-center text-center shrink-0 z-20">
            <p className="text-xs md:text-sm text-slate-500 font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              This consultation has ended. You cannot send new messages.
            </p>
          </div>
        ) : (
          <div className="bg-white border-t border-slate-100 p-3 md:p-4 px-4 md:px-8 flex gap-2 items-center shrink-0 z-20 shadow-lg md:shadow-none">
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
        )}

      </main>

      {/* Dynamic Star Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop with fade-in and blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRatingModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />
            
            {/* Premium Bottom Sheet with slide-up & pull-down-to-dismiss */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 600 }}
              dragElastic={{ top: 0.05, bottom: 1 }}
              onDragEnd={(event, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setShowRatingModal(false);
                }
              }}
              className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-t-[40px] shadow-[0_-12px_40px_rgba(15,23,42,0.12)] border-t border-slate-100 p-6 sm:p-8 flex flex-col items-center gap-6 z-10 select-none pb-8 max-h-[92vh] overflow-y-auto"
            >
              {/* Premium Pull-up indicator / Drag Handle */}
              <div 
                onPointerDown={(e) => dragControls.start(e)}
                className="w-16 h-4 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing hover:bg-slate-50/80 rounded-full transition-colors"
                title="Drag down to dismiss"
              >
                <div className="w-12 h-1.5 bg-slate-200/80 rounded-full" />
              </div>

              {/* Personalized Banner */}
              <div className="w-full flex flex-col items-center gap-4 text-center mt-2">
                {/* Dynamic Icon */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 ${ratingFeedback.color} shadow-sm animate-pulse`}>
                  {ratingFeedback.icon}
                </div>

                <div className="space-y-1.5 px-2">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Rate Your Experience
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Your consultation for <span className="text-[#f22c83] font-semibold">"{topicName}"</span> {dateStr} has been successfully closed.
                  </p>
                  <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-full px-3 py-1 text-[11px] text-slate-600 font-semibold mt-1">
                    {isAIAgent ? (
                      <Sparkles className="w-3.5 h-3.5 text-[#f22c83] fill-pink-100" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-blue-500" />
                    )}
                    Assisted by {agentName}
                  </div>
                </div>
              </div>

              {/* Interactive Stars */}
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="flex items-center gap-2.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      className="transition-transform hover:scale-115 active:scale-90 p-1 cursor-pointer"
                    >
                      <Star 
                        className={`w-9 h-9 transition-colors duration-200 ${
                          star <= selectedRating 
                            ? "fill-amber-400 stroke-amber-500 text-amber-500" 
                            : "text-slate-200 hover:text-slate-300 fill-none"
                        }`} 
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
                {/* Premium Text Label for the chosen star level */}
                <span className={`text-xs font-bold tracking-wide px-3 py-0.5 rounded-full uppercase border ${ratingFeedback.color} transition-all duration-300`}>
                  {ratingFeedback.label}
                </span>
              </div>

              {/* Comments Field */}
              <div className="w-full space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 block">
                  Additional Notes
                </label>
                <textarea
                  placeholder="Share any details about your experience (optional)..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#f22c83] focus:border-[#f22c83] focus:bg-white text-slate-800 font-medium placeholder-slate-400/85 transition-all"
                />
              </div>

              {/* Submit Actions */}
              <div className="flex gap-3 w-full shrink-0">
                <Button
                  variant="outline"
                  className="flex-1 text-xs font-bold rounded-2xl text-slate-500 border-slate-200 hover:bg-slate-50 active:scale-98 transition-all h-11 cursor-pointer"
                  onClick={() => setShowRatingModal(false)}
                >
                  Skip
                </Button>
                <Button
                  className="flex-1 text-xs font-bold rounded-2xl bg-[#f22c83] hover:bg-[#d82273] text-white shadow-md shadow-[#f22c83]/15 active:scale-98 transition-all h-11 cursor-pointer"
                  onClick={handleSubmitRating}
                >
                  Submit Feedback
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

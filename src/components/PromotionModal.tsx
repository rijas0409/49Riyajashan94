import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { 
  X, Wallet, Calendar as CalendarIcon, Info, Zap, Star, 
  TrendingUp, Crown, AlertCircle, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Pet {
  id: string;
  name: string;
  breed: string;
  image?: string;
}

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pets: Pet[];
  walletBalance: number;
  onLaunchCampaign: (data: {
    petId: string;
    promotionType: string;
    subOption?: string;
    startDate: Date;
    endDate: Date;
    totalCost: number;
  }) => void;
}

const PROMOTION_TYPES = [
  {
    id: "sponsored",
    name: "Sponsored Listing",
    price: 150,
    priceLabel: "₹150/day",
    description: "Appears at the top of search results",
    icon: TrendingUp,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    id: "banner",
    name: "Banner Ad",
    price: 200,
    priceLabel: "₹200/day",
    description: "Premium placement on homepage",
    icon: Star,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  {
    id: "priority",
    name: "Priority Boost (Quick Promote)",
    price: 49,
    priceLabel: "₹49 - ₹99",
    description: "Push your pet into top 5 results instantly",
    icon: Zap,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    subOptions: [
      { id: "24h", label: "24 hours", price: 49 },
      { id: "3d", label: "3 days", price: 99 },
    ],
  },
  {
    id: "featured",
    name: "Featured Pet of the Day",
    price: 299,
    priceLabel: "₹299/day",
    description: "Exclusive daily spotlight on homepage",
    icon: Crown,
    color: "text-rose-500",
    bgColor: "bg-rose-50",
    notice: "Only 1 slot per day",
  },
  {
    id: "urgent",
    name: "Urgent Selling Badge",
    price: 79,
    priceLabel: "₹79 for 7 days",
    description: "Adds red URGENT badge on your listing",
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-50",
    fixedDuration: 7,
  },
];

const PromotionModal = ({ isOpen, onClose, pets, walletBalance, onLaunchCampaign }: PromotionModalProps) => {
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedPromotion, setSelectedPromotion] = useState("");
  const [prioritySubOption, setPrioritySubOption] = useState("24h");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const selectedPromotionData = PROMOTION_TYPES.find(p => p.id === selectedPromotion);

  const calculateTotalCost = () => {
    if (!selectedPromotionData || !startDate || !endDate) return 0;
    
    if (selectedPromotion === "priority") {
      const subOption = selectedPromotionData.subOptions?.find(s => s.id === prioritySubOption);
      return subOption?.price || 49;
    }
    
    if (selectedPromotion === "urgent") {
      return 79;
    }
    
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return selectedPromotionData.price * days;
  };

  const totalCost = calculateTotalCost();
  const canLaunch = selectedPet && selectedPromotion && startDate && endDate && totalCost <= walletBalance;

  const handleLaunch = () => {
    if (!canLaunch || !startDate || !endDate) return;
    
    onLaunchCampaign({
      petId: selectedPet,
      promotionType: selectedPromotion,
      subOption: selectedPromotion === "priority" ? prioritySubOption : undefined,
      startDate,
      endDate,
      totalCost,
    });
  };

  // Auto-set end date for fixed duration promotions
  useEffect(() => {
    if (selectedPromotion === "urgent" && startDate) {
      const end = new Date(startDate);
      end.setDate(end.getDate() + 6);
      setEndDate(end);
    }
    if (selectedPromotion === "priority" && startDate) {
      const days = prioritySubOption === "24h" ? 0 : 2;
      const end = new Date(startDate);
      end.setDate(end.getDate() + days);
      setEndDate(end);
    }
  }, [selectedPromotion, startDate, prioritySubOption]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-xl font-semibold">Create New Promotion Campaign</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Pet Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Product *</Label>
            <Select value={selectedPet} onValueChange={setSelectedPet}>
              <SelectTrigger className="w-full rounded-2xl h-12 border-2 border-border focus:border-primary">
                <SelectValue placeholder="Choose a pet to promote" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {pets.map((pet) => (
                  <SelectItem key={pet.id} value={pet.id} className="rounded-xl">
                    <div className="flex items-center gap-3">
                      {pet.image && (
                        <img src={pet.image} alt={pet.name} className="w-8 h-8 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="font-medium">{pet.name}</p>
                        <p className="text-xs text-muted-foreground">{pet.breed}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Promotion Types */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Campaign Type *</Label>
            <RadioGroup value={selectedPromotion} onValueChange={setSelectedPromotion} className="space-y-3">
              {PROMOTION_TYPES.map((promo) => {
                const Icon = promo.icon;
                return (
                  <div key={promo.id}>
                    <label
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all",
                        selectedPromotion === promo.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <RadioGroupItem value={promo.id} className="mt-1" />
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", promo.bgColor)}>
                        <Icon className={cn("w-5 h-5", promo.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{promo.name}</p>
                            <p className="text-sm text-muted-foreground">{promo.description}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-primary whitespace-nowrap">{promo.priceLabel}</span>
                            <button type="button" className="p-1 hover:bg-muted rounded-full">
                              <Info className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                        {promo.notice && selectedPromotion === promo.id && (
                          <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-2 py-1 rounded-lg inline-block">
                            {promo.notice}
                          </p>
                        )}
                      </div>
                    </label>

                    {/* Sub-options for Priority Boost */}
                    {promo.id === "priority" && selectedPromotion === "priority" && (
                      <div className="ml-14 mt-2 flex gap-2">
                        {promo.subOptions?.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setPrioritySubOption(sub.id)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                              prioritySubOption === sub.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                            )}
                          >
                            {sub.label} – ₹{sub.price}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-2xl h-12 border-2",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PP") : "Select date"}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={selectedPromotion === "urgent" || selectedPromotion === "priority"}
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-2xl h-12 border-2",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PP") : "Select date"}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate || new Date())}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-amber-600" />
              </div>
              <span className="font-medium text-amber-900">Wallet Balance:</span>
            </div>
            <span className="text-xl font-bold text-amber-900">₹{walletBalance}</span>
          </div>

          {/* Cost Summary */}
          {selectedPromotion && startDate && endDate && (
            <div className="p-4 bg-muted/50 rounded-2xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Campaign Cost</span>
                <span className="font-medium">₹{totalCost}</span>
              </div>
              {totalCost > walletBalance && (
                <p className="text-xs text-destructive">
                  Insufficient wallet balance. Please add ₹{totalCost - walletBalance} more.
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleLaunch}
              disabled={!canLaunch}
              className={cn(
                "flex-1 rounded-2xl h-12 font-medium transition-all",
                canLaunch
                  ? "bg-gradient-to-r from-rose-400 to-rose-500 hover:opacity-90 text-white"
                  : "bg-rose-200 text-rose-400 cursor-not-allowed"
              )}
            >
              Pay from Wallet & Launch Campaign
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-2xl h-12 px-6"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PromotionModal;

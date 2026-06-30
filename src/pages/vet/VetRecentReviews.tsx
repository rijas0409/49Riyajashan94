import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft, Star, ChatTeardropText } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import SplashScreen from "@/components/SplashScreen";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user_name: string;
}

const VetRecentReviews = () => {
  const navigate = useNavigate();
  const { user, isLoading: guardLoading } = useRoleGuard(["vet"], "/auth/vet");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("vet_reviews")
        .select(`
          id,
          rating,
          review_text,
          created_at,
          profiles (
            name,
            full_name
          )
        `)
        .eq("vet_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reviews:", error);
      } else if (data) {
        const formattedReviews = data.map((r: { id: string, rating: number, review_text: string | null, created_at: string, profiles: { name: string, full_name: string } | null }) => ({
          id: r.id,
          rating: r.rating,
          review_text: r.review_text,
          created_at: r.created_at,
          user_name: r.profiles?.full_name || r.profiles?.name || "Anonymous User"
        }));
        setReviews(formattedReviews);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (guardLoading || loading) {
    return <SplashScreen message="Loading reviews..." />;
  }

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  return (
    <div className="bg-[#FDFBFF] min-h-screen pb-24 font-sans text-slate-900 selection:bg-purple-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-transparent">
        <div className="flex items-center">
          <button onClick={() => navigate("/vet/profile")} className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors mr-4">
            <CaretLeft size={24} weight="bold" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Recent Reviews</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6 space-y-6">
        <div className="bg-white rounded-[2rem] p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 mb-2">
          <h2 className="text-5xl font-extrabold text-slate-900 mb-2">{avgRating}</h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star 
                key={i} 
                size={24} 
                weight={i <= Math.round(Number(avgRating)) ? "fill" : "regular"} 
                className={i <= Math.round(Number(avgRating)) ? "text-yellow-400" : "text-slate-200"} 
              />
            ))}
          </div>
          <p className="text-slate-500 font-medium">Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <ChatTeardropText size={32} weight="bold" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Reviews Yet</h3>
            <p className="text-slate-500 font-medium text-sm">When pet parents leave reviews for your consultations, they will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900">{review.user_name}</h4>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      {format(new Date(review.created_at), 'dd MMM yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 bg-yellow-50 px-2 py-1 rounded-lg">
                    <span className="text-xs font-bold text-yellow-700">{review.rating.toFixed(1)}</span>
                    <Star size={12} weight="fill" className="text-yellow-500" />
                  </div>
                </div>
                {review.review_text && (
                  <p className="text-slate-600 text-sm mt-3 leading-relaxed">"{review.review_text}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default VetRecentReviews;

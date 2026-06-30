import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Home, Compass } from "lucide-react";

const NoVetFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-6">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate("/buyer/vet")}
          className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-sm font-semibold text-muted-foreground">Smart Match Result</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto my-auto space-y-6">
        <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center border border-pink-100 shadow-sm animate-bounce">
          <RefreshCw className="w-10 h-10 text-pink-500 animate-spin" style={{ animationDuration: "12s" }} />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight">
            No Vet Matched Your Criteria
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We couldn't find a specialist matching your criteria right now. Please update your tags or try a home visit.
          </p>
        </div>

        <div className="w-full space-y-3 pt-4">
          <button
            onClick={() => navigate("/buyer/care-match")}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-6 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md shadow-pink-500/10"
          >
            <RefreshCw className="w-5 h-5" />
            Update Symptoms & Tags
          </button>

          <button
            onClick={() => navigate("/buyer/vet", { state: { filterMode: "home" } })}
            className="w-full bg-white hover:bg-slate-50 border border-border text-foreground font-bold py-4 px-6 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Home className="w-5 h-5 text-pink-500" />
            Try a Home Visit
          </button>

          <button
            onClick={() => navigate("/buyer/vet")}
            className="w-full bg-slate-100 hover:bg-slate-200 text-foreground font-bold py-3 px-6 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-muted-foreground" />
            Explore Other Vets
          </button>
        </div>
      </main>

      <footer className="text-center text-xs text-muted-foreground py-4">
        Need urgent assistance? Please call your nearest 24/7 veterinary clinic.
      </footer>
    </div>
  );
};

export default NoVetFound;

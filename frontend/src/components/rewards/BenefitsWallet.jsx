import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ResidentBenefitsCatalog, VisitorBenefitsCatalog } from "../../utils/constants";
import { ClaimModal } from "./ClaimModal";
import { 
  Gift, 
  Award, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Bus, 
  Ticket, 
  ExternalLink, 
  QrCode,
  Sparkles,
  Layers,
  ShoppingBag
} from "lucide-react";

export function BenefitsWallet() {
  const { currentUser, isVisitor, claimedRewards, claimReward } = useAuth();

  const [activeCatalogTab, setActiveCatalogTab] = useState(isVisitor ? "visitor" : "resident");
  const [selectedReward, setSelectedReward] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentlyClaimedVoucher, setRecentlyClaimedVoucher] = useState(null);

  if (!currentUser) return null;

  const points = currentUser.civicPoints || 0;
  const currentCatalog = activeCatalogTab === "visitor" ? VisitorBenefitsCatalog : ResidentBenefitsCatalog;

  const handleOpenClaim = (reward) => {
    setSelectedReward(reward);
    setRecentlyClaimedVoucher(null);
    setIsModalOpen(true);
  };

  const handleConfirmClaim = (reward) => {
    try {
      const claimResult = claimReward(reward);
      setRecentlyClaimedVoucher(claimResult);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* Wallet Summary Hero Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Gift className="w-3.5 h-3.5 text-emerald-400" />
              <span>Civic Participation Benefits Wallet</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Civic Rewards & Partner Perks
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg">
              Earn validated civic contribution points by improving public safety and infrastructure, then redeem for partner and municipal advantages.
            </p>
          </div>

          {/* Balance Widget */}
          <div className="bg-slate-950/90 border border-sky-500/40 p-4 sm:p-5 rounded-2xl shadow-inner text-right min-w-[200px]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Available Balance
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono text-emerald-400 block my-0.5">
              🏆 {points}
            </span>
            <span className="text-[11px] text-slate-400">
              Civic Contribution Points
            </span>
          </div>
        </div>
      </div>

      {/* Catalog Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveCatalogTab("resident")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeCatalogTab === "resident"
                ? "bg-sky-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🏠 Resident Benefits
          </button>
          <button
            onClick={() => setActiveCatalogTab("visitor")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeCatalogTab === "visitor"
                ? "bg-purple-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🌍 Visitor & Mobility Perks
          </button>
        </div>

        <span className="text-xs text-slate-400">
          Showing <strong className="text-slate-200">{currentCatalog.length}</strong> available benefits
        </span>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentCatalog.map((benefit) => {
          const isAffordable = points >= benefit.pointsRequired;
          const isClaimed = claimedRewards.some((c) => c.rewardId === benefit.id);

          return (
            <div
              key={benefit.id}
              className={`glass-card p-5 rounded-2xl border flex flex-col justify-between transition-all hover:translate-y-[-2px] ${
                isAffordable
                  ? "border-slate-800 hover:border-sky-500/60"
                  : "border-slate-800/60 opacity-85"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-sky-400">
                    {benefit.category}
                  </span>
                  <span className="text-xs font-mono font-extrabold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
                    {benefit.pointsRequired} pts
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1.5 leading-snug">
                  {benefit.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {benefit.description}
                </p>

                <div className="text-[11px] text-slate-400 mb-4 pt-2 border-t border-slate-800/80">
                  <span>Provided by: </span>
                  <strong className="text-slate-200">{benefit.partner}</strong>
                </div>
              </div>

              <div>
                {isClaimed ? (
                  <button
                    disabled
                    className="w-full py-2 px-3 rounded-xl bg-slate-800/90 text-emerald-400 text-xs font-bold border border-emerald-800/40 flex items-center justify-center gap-1.5 cursor-default"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Claimed & in Wallet</span>
                  </button>
                ) : isAffordable ? (
                  <button
                    onClick={() => handleOpenClaim(benefit)}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
                  >
                    <Gift className="w-4 h-4" />
                    <span>Claim Benefit</span>
                  </button>
                ) : (
                  <div className="text-center py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-xs font-medium">
                    Needs {benefit.pointsRequired - points} more points
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Claimed Vouchers Drawer */}
      {claimedRewards.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 mt-8">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                My Active Vouchers & Redemptions ({claimedRewards.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Present code to redeem</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {claimedRewards.map((c) => (
              <div
                key={c.id}
                className="bg-slate-950 p-4 rounded-xl border border-emerald-900/40 space-y-2 shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate">{c.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    ACTIVE
                  </span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-center font-mono font-bold text-emerald-400 text-sm tracking-wider">
                  {c.voucherCode}
                </div>
                <p className="text-[10px] text-slate-500">
                  Expires: {c.expiryDate} • Used {c.pointsUsed} pts
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claim Modal Dialog */}
      <ClaimModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reward={selectedReward}
        onClaimConfirm={handleConfirmClaim}
        claimedVoucher={recentlyClaimedVoucher}
      />
    </div>
  );
}

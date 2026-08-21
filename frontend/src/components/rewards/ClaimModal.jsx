import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { 
  Gift, 
  Award, 
  CheckCircle2, 
  Copy, 
  Check, 
  Clock, 
  Building2,
  Sparkles,
  QrCode
} from "lucide-react";

export function ClaimModal({ isOpen, onClose, reward, onClaimConfirm, claimedVoucher }) {
  const [copied, setCopied] = useState(false);

  if (!reward) return null;

  const handleCopyCode = () => {
    if (!claimedVoucher?.voucherCode) return;
    navigator.clipboard.writeText(claimedVoucher.voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-emerald-400" />
          <span>{claimedVoucher ? "Reward Voucher Unlocked!" : "Claim Civic Benefit"}</span>
        </div>
      }
      subtitle={claimedVoucher ? "Present this voucher code to partner or municipal staff" : `Redeem with your validated Civic Points`}
      maxWidth="max-w-md"
    >
      {claimedVoucher ? (
        <div className="text-center space-y-5 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-glow-primary">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{reward.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{reward.partner}</p>
          </div>

          {/* Voucher Code Box */}
          <div className="p-4 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono font-bold block">
              Redemption Voucher Code
            </span>
            
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-2xl font-extrabold text-white tracking-widest">
                {claimedVoucher.voucherCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Valid until: <strong className="text-slate-200">{claimedVoucher.expiryDate}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition"
          >
            Close & View in Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <h3 className="text-base font-bold text-white">{reward.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{reward.description}</p>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-400">
              <span>Partner: <strong className="text-slate-200">{reward.partner}</strong></span>
              <span>Category: <strong className="text-slate-200">{reward.category}</strong></span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-sky-950/40 border border-sky-800/60 text-xs">
            <span className="text-slate-300 font-medium">Points Required for Claim:</span>
            <span className="font-mono font-bold text-base text-amber-400">
              {reward.pointsRequired} Civic Points
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-tight">
            * This will deduct {reward.pointsRequired} points from your available balance. Your total lifetime civic level progress remains preserved.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onClaimConfirm(reward)}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Claim</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

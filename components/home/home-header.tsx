/**
 * FILE: components/home/home-header.tsx
 *
 * PURPOSE:
 *   Gradient hero header on the home screen. Coral-orange gradient banner with
 *   greeting, mood emoji selector row, and the "Ask Dr. Riya" AI input bar.
 *
 * LOGIC OVERVIEW:
 *   1. Derives firstName and profileImage from the auth session.
 *   2. Renders a coral→orange gradient banner (--mt-gradient-greeting) with the
 *      greeting text (sentence case, mt-h2 + display name), mood row, and AI bar.
 *   3. Mood selector: 5 emoji faces in a frosted pill. Tapping a face navigates
 *      to /mood-tracker?mood=<1-5> so the tracker pre-selects that mood.
 *   4. AI input bar: white floating card overlapping the content below. Empty =
 *      mic icon; typed text = orange send icon. Enter or tap send opens /chat/thread.
 *   5. The banner uses rounded-b-[32px] so the card section below sits flush.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   firstName        — first word of user.name, or "There" as fallback
 *   profileImage     — user profile image URL (may be absent)
 *   inputText        — controlled state for the Dr. Riya input bar
 *   handleSend       — creates UUID thread and navigates to /chat/thread/<id>?q=
 *
 * DEPENDENCIES:
 *   useAuth() — provides user.name and profile_image
 *   useRouter() — navigation on send and mood pill tap
 *
 * LAST UPDATED: 2026-04-30 — Mood pill now navigates to /sleep-tracker; removed
 *   per-mood selection state and onMoodClick prop.
 */

"use client";

import { Bell, Mic, SendHorizonal, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

/* Mood faces per design system spec — emoji only in the mood-faces selector */
const MOODS = ["😣", "😔", "😀", "😊", "😄"];

export function HomeHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const [inputText, setInputText] = useState("");

  const name = (user?.name as string | undefined) ?? "There";
  const firstName = name.split(" ")[0];
  const profileImage = user?.profile_image as string | undefined;

  /* Navigate to a fresh thread and pass the typed question as ?q= so the
   * thread page can auto-send it as the first message. */
  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      router.push("/chat/new");
      return;
    }
    const threadId = crypto.randomUUID();
    router.push(`/chat/thread/${threadId}?q=${encodeURIComponent(trimmed)}`);
    setInputText("");
  };

  return (
    <div
      className="relative w-full rounded-b-[32px] px-5 pt-4 pb-10 text-white z-[16]"
      style={{ background: "var(--mt-gradient-greeting)" }}
    >
      <div className="relative z-20 flex flex-col gap-5">
        {/* ── Top bar: greeting + notification + avatar ── */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col leading-tight">
            <span
              className="text-[13px] font-medium text-white/75 tracking-wide uppercase"
              style={{ letterSpacing: "0.04em" }}
            >
              Good morning,
            </span>
            <span className="text-[24px] font-black text-white leading-tight tracking-tight mt-0.5">
              {firstName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/notifications")}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors duration-[140ms] active:scale-95"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5 text-white" />
            </button>

            {/* Avatar — orange gradient fallback when no profile image */}
            <button
              onClick={() => router.push("/profile")}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/40 transition-transform duration-[140ms] hover:scale-105 active:scale-95"
              aria-label="Go to profile"
            >
              {profileImage && profileImage !== "/profile.png" ? (
                <Image
                  src={profileImage}
                  alt={firstName}
                  width={40}
                  height={40}
                  className="object-cover h-full w-full"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #FBB7BC, #F97316)" }}
                >
                  <span className="text-base font-black text-white select-none">
                    {firstName?.[0]}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* ── Greeting question ── */}
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] font-bold leading-snug tracking-tight max-w-[260px]">
            How are you feeling today?
          </h2>
          <p className="text-[13px] text-white/75 font-medium leading-relaxed">
            Your check-in shapes your guidance and support.
          </p>
        </div>

        {/* ── Mood emoji row — each emoji navigates to /sleep-tracker with its mood id ── */}
        <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-full px-4 py-2.5 border border-white/10 w-fit">
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest whitespace-nowrap">
            Tap your mood
          </span>
          <div className="flex gap-2">
            {MOODS.map((emoji, i) => {
              const moodId = i + 1;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => router.push(`/mood-tracker?mood=${moodId}`)}
                  aria-label={`Log mood ${moodId}`}
                  className="text-xl opacity-80 transition-all duration-[220ms] select-none hover:opacity-100 hover:scale-110 active:scale-95"
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── AI input bar — floats down over the card section below ── */}
        <div className="mt-1 mb-[-28px] z-50">
          <div className="w-full bg-white rounded-[28px] shadow-[0_8px_24px_rgba(15,23,42,0.10)] px-4 py-2.5 flex items-center gap-3 border border-[#ECE6DE]">
            <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: "#F97316" }} />
            <input
              className="flex-1 border-0 bg-transparent outline-none text-[14px] font-medium text-[#0E1726] placeholder:text-[#9AA0AB] py-1"
              placeholder="Ask Dr. Riya anything…"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              aria-label="Ask Dr. Riya"
            />
            <button
              onClick={handleSend}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-[140ms] active:scale-95"
              aria-label={inputText.trim() ? "Send message" : "Open chat"}
            >
              {inputText.trim() ? (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(249,115,22,0.28)]"
                  style={{ background: "#F97316" }}
                >
                  <SendHorizonal className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#F4F2EE]">
                  <Mic className="w-4 h-4 text-[#6B7280]" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

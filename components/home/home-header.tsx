/**
 * FILE: components/home/home-header.tsx
 *
 * PURPOSE:
 *   Gradient hero header shown only on the home screen. Contains the greeting,
 *   mood selector, and a functional "Ask Dr. Riya" input bar.
 *
 * LOGIC OVERVIEW:
 *   1. Derives firstName and profileImage from the auth session.
 *   2. Renders a gradient banner with greeting text and mood selector row.
 *   3. The AI input bar is a real controlled <input>. While empty it shows a
 *      Mic icon; once the user types, the Mic swaps for a SendHorizonal icon.
 *   4. On submit (Enter or tap send icon), a new UUID thread is generated and
 *      the router navigates to /chat/thread/<uuid>?q=<encoded message>.
 *      The chat thread page reads the ?q param and auto-sends it as the first
 *      message, so the new chat opens with the user's question in-flight.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   firstName        — first word of user.name, or "There" as fallback
 *   profileImage     — user profile image URL (may be absent)
 *   inputText        — controlled state for the Dr. Riya input
 *   handleSend       — creates a new thread UUID and pushes to it with ?q=
 *
 * DEPENDENCIES:
 *   useAuth() — provides user name and profile image
 *   useRouter() — for navigation on send
 *
 * LAST UPDATED: 2026-04-23 — converted Ask Dr. Riya from button to real input with send
 */

"use client";

import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Mic, SendHorizonal, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  moodTracker?: Array<{ simily?: { id: number } }>;
  onMoodClick?: () => void;
}

const MOODS = ["😟", "😐", "😊", "😄", "🤩"];

export function HomeHeader({ moodTracker, onMoodClick }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [inputText, setInputText] = useState("");

  const name = (user?.name as string | undefined) ?? "There";
  const firstName = name.split(" ")[0];
  const profileImage = user?.profile_image as string | undefined;
  const currentMoodId = moodTracker?.[0]?.simily?.id;

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
    <div className="home-header-gradient relative w-full rounded-b-2xl px-4 pt-5 pb-8 text-white z-[16]">
      <div className="relative z-20 flex flex-col gap-4">
        {/* Top bar — greeting + actions */}
        <div className="flex justify-between items-center h-12">
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-medium text-white/80">Good Morning,</span>
            <span className="text-[20px] font-black text-white leading-tight">{firstName}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/notifications")}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={() => router.push("/profile")}
              className="w-10 h-10 rounded-full overflow-hidden border border-white/30 transition-all hover:scale-105 active:scale-95 bg-white/10"
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
                <div className="w-full h-full flex items-center justify-center bg-white/20">
                  <span className="text-base font-bold text-white select-none">
                    {firstName?.[0]}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Greeting + mood selector */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-1.5 max-w-[280px]">
            <h2 className="text-[22px] font-bold leading-[1.15] tracking-tight">
              Hi <span className="font-black">{firstName}</span>, how are you feeling today?
            </h2>
            <p className="text-white/80 text-[13px] font-medium leading-relaxed">
              Your check-in helps us shape your home, guidance, and support.
            </p>
          </div>

          <button
            onClick={onMoodClick}
            className="flex items-center bg-white/15 backdrop-blur-md rounded-xl px-4 py-2 gap-2.5 border border-white/10 w-fit hover:bg-white/20 transition-all"
            aria-label="Select your mood"
          >
            <span className="text-[9px] font-bold text-white uppercase tracking-widest whitespace-nowrap opacity-90">
              Tap your mood
            </span>
            <div className="flex gap-2.5">
              {MOODS.map((emoji, i) => {
                const isSelected = currentMoodId ? currentMoodId === i + 1 : false;
                return (
                  <span
                    key={i}
                    className={`text-xl transition-all duration-300 ${
                      isSelected
                        ? "bg-black/80 rounded-full w-8 h-8 flex items-center justify-center -mx-0.5 scale-110"
                        : "opacity-90 hover:opacity-100 hover:scale-125"
                    }`}
                  >
                    {emoji}
                  </span>
                );
              })}
            </div>
          </button>
        </div>

        {/* AI input bar — overlaps the card section below */}
        <div className="mt-1 mb-[-24px] z-50">
          <div className="w-full bg-card rounded-[28px] shadow-lg px-4 py-2 flex items-center gap-3 border border-border">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
            <Input
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-[14px] font-medium text-foreground placeholder:text-muted-foreground px-0 py-1 h-auto"
              placeholder="Ask Dr. Riya anything..."
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
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
              aria-label={inputText.trim() ? "Send message" : "Open chat"}
            >
              {inputText.trim() ? (
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                  <SendHorizonal className="w-4 h-4 text-primary-foreground" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <Mic className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

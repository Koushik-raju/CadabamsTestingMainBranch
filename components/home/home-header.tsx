'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Sparkles, Mic } from 'lucide-react';

interface Props {
  userName: string;
  profileImage?: string;
  moodTracker?: Array<{ simily?: { id: number } }>;
  onMoodClick?: () => void;
}

const MOODS = ['😟', '😐', '😊', '😄', '🤩'];

export function HomeHeader({ userName, profileImage, moodTracker, onMoodClick }: Props) {
  const router = useRouter();
  const currentMoodId = moodTracker?.[0]?.simily?.id;

  return (
    <div className="home-header-gradient relative w-full rounded-b-2xl px-4 pt-5 pb-8 text-white z-[16]">
      <div className="relative z-20 flex flex-col gap-4">
        {/* Top bar — profile avatar */}
        <div className="flex justify-end items-center h-12">
          <button
            onClick={() => router.push('/profile')}
            className="w-10 h-10 rounded-full overflow-hidden border border-white/30 transition-all hover:scale-105 active:scale-95 bg-white/10"
            aria-label="Go to profile"
          >
            {profileImage && profileImage !== '/profile.png' ? (
              <Image src={profileImage} alt={userName} width={40} height={40} className="object-cover h-full w-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/20">
                <span className="text-base font-bold text-white select-none">
                  {userName?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Greeting + mood selector */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-1.5 max-w-[280px]">
            <h2 className="text-[22px] font-bold leading-[1.15] tracking-tight">
              Hi <span className="font-black">{userName.split(' ')[0]}</span>, how are you feeling today?
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
                        ? 'bg-black/80 rounded-full w-8 h-8 flex items-center justify-center -mx-0.5 scale-110'
                        : 'opacity-90 hover:opacity-100 hover:scale-125'
                    }`}
                  >
                    {emoji}
                  </span>
                );
              })}
            </div>
          </button>
        </div>

        {/* AI search bar — overlaps the card section below */}
        <div className="mt-1 mb-[-24px] z-50">
          <div className="bg-card rounded-xl shadow-lg px-4 py-2 flex items-center gap-4 border border-border">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-[14px] flex-grow font-semibold text-muted-foreground tracking-tight">
              Ask Dr. Riya anything...
            </span>
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-muted/80 transition-all active:scale-90">
              <Mic className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

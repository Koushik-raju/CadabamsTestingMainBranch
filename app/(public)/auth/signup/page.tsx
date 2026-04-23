"use client";

import { OTPInput } from "@/components/common/otp-input";
import { type Country, PhoneInput } from "@/components/common/phone-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useAuthActions } from "@/hooks/use-auth-actions";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z
    .string()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid email address")
    .optional(),
  phone: z.string().min(6, "Valid phone number required"),
});
type SignupForm = z.infer<typeof signupSchema>;

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { sendOtp, verifySignup, isSendingOtp, isVerifying } = useAuthActions();

  const [country, setCountry] = useState<Country | null>(null);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(0);
  const verifyingRef = useRef(false);

  const mobileParam = searchParams.get("mobile") ?? "";

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: mobileParam },
  });

  useEffect(() => {
    if (mobileParam) setValue("phone", mobileParam);
  }, [mobileParam, setValue]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const onSendOtp = async (data: SignupForm) => {
    try {
      await sendOtp(data.phone, "signup");
      toast.success("OTP sent successfully");
      setStep("otp");
      setTimer(30);
    } catch {
      toast.error("Failed to send OTP. Try again.");
    }
  };

  const handleSignup = useCallback(
    async (code: string) => {
      if (code.length < 4 || verifyingRef.current) return;
      verifyingRef.current = true;
      const { phone, firstName, lastName, email } = getValues();
      try {
        await verifySignup({
          phone,
          otp: code,
          firstName,
          lastName: lastName || undefined,
          email: email || undefined,
          countryCode: country?.callingCode ? Number(country.callingCode) : undefined,
        });
        toast.success("Account created! Welcome to Cadabams.");
        login().catch(() => {});
        router.replace("/home");
      } catch (err: unknown) {
        const e = err as { status?: number; error?: string };
        if (e.error?.includes("already exists")) {
          toast.error("Account already exists");
          router.push("/auth/login");
          return;
        }
        toast.error(e.error ?? "Signup failed. Try again.");
        setOtp("");
      } finally {
        verifyingRef.current = false;
      }
    },
    [verifySignup, getValues, country, login, router],
  );

  useEffect(() => {
    if (otp.length === 4) handleSignup(otp);
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Gradient hero */}
      <div className="home-header-gradient px-6 pt-14 pb-12 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
            <Heart className="size-5 text-primary-foreground fill-primary-foreground" />
          </div>
          <span className="text-xs font-bold text-primary-foreground/80 tracking-widest uppercase">
            Cadabams
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-primary-foreground leading-tight">
            {step === "form" ? "Start your journey." : "Verify your number."}
          </h1>
          <p className="text-sm text-primary-foreground/70 mt-1">Mental health care, simplified.</p>
        </div>
      </div>

      {/* Card — overlaps hero */}
      <div className="flex-1 flex flex-col px-4 mt-[-16px] pb-8">
        <Card className="w-full max-w-sm mx-auto">
          {/* Step progress */}
          <div className="flex gap-1 px-4 pt-4">
            <div className="h-1 flex-1 rounded-full bg-primary" />
            <div
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                step === "otp" ? "bg-primary" : "bg-border",
              )}
            />
          </div>

          {step === "form" ? (
            <>
              <CardHeader>
                <CardTitle>Create account</CardTitle>
                <CardDescription>A few quick details to get you started</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit(onSendOtp)} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="firstName">
                        First name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="First"
                        autoComplete="given-name"
                        {...register("firstName")}
                        aria-invalid={!!errors.firstName}
                      />
                      {errors.firstName && (
                        <p className="text-xs text-destructive">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        placeholder="Last"
                        autoComplete="family-name"
                        {...register("lastName")}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">
                      Email <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...register("email")}
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <Controller
                    name="phone"
                    control={control}
                    render={({ field, fieldState }) => (
                      <div className="flex flex-col gap-1.5">
                        <PhoneInput
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          selectedCountry={country}
                          onCountryChange={setCountry}
                        />
                        {fieldState.error && (
                          <p className="text-xs text-destructive">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Button type="submit" size="lg" disabled={isSendingOtp} className="w-full">
                    {isSendingOtp ? "Sending…" : "Continue"}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex-col gap-3 text-sm">
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <Button variant="link" asChild className="p-0 h-auto text-sm">
                    <Link href="/auth/login">Log in</Link>
                  </Button>
                </p>
                <Separator />
                <div className="flex gap-4">
                  <Button
                    variant="link"
                    asChild
                    className="p-0 h-auto text-xs text-muted-foreground"
                  >
                    <Link href="/privacy-policy">Privacy Policy</Link>
                  </Button>
                  <Button
                    variant="link"
                    asChild
                    className="p-0 h-auto text-xs text-muted-foreground"
                  >
                    <Link href="/term-and-condition">Terms &amp; Conditions</Link>
                  </Button>
                </div>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-1 mb-1 w-fit text-muted-foreground"
                  onClick={() => {
                    setStep("form");
                    setOtp("");
                  }}
                >
                  <ArrowLeft className="size-4" />
                  Go back
                </Button>
                <CardTitle>Verify your number</CardTitle>
                <CardDescription>
                  Code sent to{" "}
                  <span className="font-medium text-foreground">
                    +{country?.callingCode ?? "91"} {getValues("phone")}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <OTPInput value={otp} onChange={setOtp} />
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={() => handleSignup(otp)}
                  disabled={isVerifying || otp.length < 4}
                >
                  {isVerifying ? "Verifying…" : "Verify & Create Account"}
                </Button>
              </CardContent>

              <CardFooter className="justify-center">
                {timer > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Resend in{" "}
                    <span className="tabular-nums font-medium text-foreground">{timer}s</span>
                  </p>
                ) : (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={handleSubmit(onSendOtp)}
                  >
                    Resend OTP
                  </Button>
                )}
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Skeleton className="h-96 w-80 rounded-xl" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}

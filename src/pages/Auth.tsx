import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, Scissors, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);

      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);

      setError("The verification code you entered is incorrect.");
      setIsLoading(false);

      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(
        `Failed to sign in as guest: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Mini header */}
      <header className="border-b-2 border-border">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-4 sm:px-6">
          <a href="/" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center border-2 border-border bg-accent shadow-brutal-sm">
              <Scissors className="size-5" />
            </div>
            <span className="text-lg font-extrabold uppercase tracking-tight">
              Snip<span className="text-muted-foreground">.link</span>
            </span>
          </a>
        </div>
      </header>

      {/* Auth Content */}
      <div className="flex flex-1 items-center justify-center bg-brutal-grid px-4 py-10">
        <Card className="w-full max-w-sm border-2 border-border pb-0 shadow-brutal-lg">
          {step === "signIn" ? (
            <>
              <CardHeader className="border-b-2 border-border bg-secondary text-center">
                <CardTitle className="text-xl font-extrabold uppercase">
                  Get started
                </CardTitle>
                <CardDescription className="font-medium">
                  Enter your email to log in or sign up
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSubmit}>
                <CardContent className="flex flex-col gap-4 pt-6">
                  <Input
                    name="email"
                    placeholder="name@example.com"
                    type="email"
                    className="h-11 border-2 border-border bg-card font-medium"
                    disabled={isLoading}
                    required
                  />
                  {error && (
                    <p className="border-2 border-destructive bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="press h-12 w-full border-2 border-border bg-primary font-extrabold uppercase shadow-brutal hover:bg-primary hover:text-primary-foreground"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t-2 border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="press h-12 w-full border-2 border-border bg-accent font-extrabold uppercase shadow-brutal hover:bg-accent hover:text-accent-foreground"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                  >
                    <UserX className="size-4" />
                    Continue as guest
                  </Button>
                </CardContent>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="border-b-2 border-border bg-secondary text-center">
                <CardTitle className="text-xl font-extrabold uppercase">
                  Check your email
                </CardTitle>
                <CardDescription className="font-medium">
                  We&apos;ve sent a code to {step.email}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleOtpSubmit}>
                <CardContent className="flex flex-col items-center gap-4 pt-6">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />

                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        otp.length === 6 &&
                        !isLoading
                      ) {
                        const form = (e.target as HTMLElement).closest("form");
                        if (form) {
                          form.requestSubmit();
                        }
                      }
                    }}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>

                  {error && (
                    <p className="border-2 border-destructive bg-destructive/10 px-3 py-2 text-center text-sm font-semibold text-destructive">
                      {error}
                    </p>
                  )}

                  <p className="text-center text-sm font-medium text-muted-foreground">
                    Didn&apos;t receive a code?{" "}
                    <Button
                      variant="link"
                      className="h-auto p-0 font-bold underline"
                      onClick={() => setStep("signIn")}
                    >
                      Try again
                    </Button>
                  </p>

                  <Button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="press h-12 w-full border-2 border-border bg-primary font-extrabold uppercase shadow-brutal hover:bg-primary hover:text-primary-foreground"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify code
                        <ArrowRight className="ml-2 size-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("signIn")}
                    disabled={isLoading}
                    className="press h-11 w-full border-2 border-border bg-card font-bold shadow-brutal-sm hover:bg-card"
                  >
                    Use different email
                  </Button>
                </CardContent>
              </form>
            </>
          )}

          <div className="border-t-2 border-border bg-muted px-6 py-3 text-center text-xs font-semibold text-muted-foreground">
            Back to{" "}
            <a
              href="/"
              className="font-bold underline decoration-2 underline-offset-2 hover:text-foreground"
            >
              home
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}

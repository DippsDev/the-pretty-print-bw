import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "../../../utils/supabase/client";
import Loader from "../chat/Loader";
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

const supabase = createClient();

declare global {
  interface Window {
    handleSignInWithGoogle?: (response: any) => void;
    google?: any; // <-- Add this line for TypeScript
  }
}

type Step = "email" | "signup" | "login";

export default function AuthModal({
  open,
  onClose,
  onSignupSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSignupSuccess?: (user: any) => void;
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Signup fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState<string | undefined>();
  const [agreement, setAgreement] = useState(false);

  // Login fields
  const [loginPassword, setLoginPassword] = useState("");

  // Nonce and hashed nonce for Google One Tap
  const [nonce, setNonce] = useState<string | null>(null);
  const [hashedNonce, setHashedNonce] = useState<string | null>(null);

  // Load Google One Tap script once
  useEffect(() => {
    if (!document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.id = "google-gsi-script";
      document.body.appendChild(script);
    }
  }, []);

  // Generate nonce and hash for Google One Tap
  useEffect(() => {
    if (!open || step !== "email") return;
    const nonceVal = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
    setNonce(nonceVal);
    const encoder = new TextEncoder();
    const encodedNonce = encoder.encode(nonceVal);
    crypto.subtle.digest('SHA-256', encodedNonce).then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashed = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setHashedNonce(hashed);
    });
  }, [open, step]);

  // Only initialize Google One Tap config when user clicks the button
  const googlePromptInitialized = React.useRef(false);
  function handleGoogleContinue() {
    if (
      typeof window !== "undefined" &&
      window.google?.accounts?.id &&
      nonce &&
      hashedNonce &&
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    ) {
      // Only initialize once per modal open
      if (!googlePromptInitialized.current) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: "handleSignInWithGoogle",
          nonce: hashedNonce,
          use_fedcm_for_prompt: true,
          ux_mode: "popup",
          auto_select: false,
          context: "signin",
        });
        googlePromptInitialized.current = true;
      }
      window.google.accounts.id.prompt();
    }
  }

  // Reset googlePromptInitialized when modal closes or step changes
  useEffect(() => {
    if (!open || step !== "email") {
      googlePromptInitialized.current = false;
    }
  }, [open, step]);

  // Expose the callback globally for Google
  useEffect(() => {
    window.handleSignInWithGoogle = async function handleSignInWithGoogle(response: any) {
      setLoading(true);
      setErrorMsg(null);

      if (!response || !response.credential) {
        setErrorMsg("Google sign-in failed. Please try again or use another method.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
          nonce: nonce || undefined,
        });
        if (error) {
          // Show more details for network/CORS errors
          if (
            error.message?.includes("CORS") ||
            error.message?.includes("ERR_FAILED") ||
            error.message?.includes("IdentityCredentialError")
          ) {
            setErrorMsg(
              "Google sign-in failed due to a network or CORS error. Please check your internet connection and ensure your domain is authorized in your Google Cloud Console."
            );
          } else {
            setErrorMsg(error.message || "Google sign-in failed. Please try again.");
          }
        } else if (data.user) {
          if (onSignupSuccess) onSignupSuccess(data.user);
          onClose();
        } else {
          setErrorMsg("Google sign-in failed. Please try again.");
        }
      } catch (err: any) {
        setErrorMsg(
          "Google sign-in failed due to a network or CORS error. Please check your internet connection and ensure your domain is authorized in your Google Cloud Console."
        );
      }
      setLoading(false);
    };
    return () => {
      delete window.handleSignInWithGoogle;
    };
    // eslint-disable-next-line
  }, [nonce, onSignupSuccess, onClose]);

  async function handleSocialLogin(provider: "google" | "facebook") {
    setLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setErrorMsg(error.message);
    setLoading(false);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const resp = await fetch("/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await resp.json();
      if (resp.ok) {
        if (result.exists) {
          setStep("login");
        } else {
          setStep("signup");
        }
      } else {
        setErrorMsg(result.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  async function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    if (!agreement) {
      setErrorMsg("You must agree to the Privacy Policy and Terms.");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone, // phone is now in E.164 format
        },
      },
    });
    if (error) {
      setErrorMsg(error.message);
    } else {
      if (data.user && data.session) {
        if (onSignupSuccess) onSignupSuccess(data.user);
        onClose();
      } else {
        setErrorMsg("Check your email for a confirmation link.");
      }
    }
    setLoading(false);
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: loginPassword,
    });
    if (error) {
      setErrorMsg("Incorrect password. Please try again.");
    } else {
      if (data.user && data.session) {
        if (onSignupSuccess) onSignupSuccess(data.user);
        onClose();
      }
    }
    setLoading(false);
  }

  // Helper to get modal height based on step
  function getModalHeight() {
    switch (step) {
      case "email":
        return 420;
      case "signup":
        return 540;
      case "login":
        return 340;
      default:
        return 420;
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          tabIndex={-1}
          aria-labelledby="auth-modal-title"
          className="fixed inset-0 z-[203] flex items-center justify-center"
          style={{ minHeight: "100dvh" }}
          onClick={onClose}
        >
          {/* Overlay with only fade/blur, no scale */}
          <motion.div
            key="auth-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "linear" }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            style={{ zIndex: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="auth-modal-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-0 flex flex-col"
            style={{
              zIndex: 1,
              height: "auto",
              maxHeight: "90dvh",
              overflow: "visible",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
              {(step === "signup" || step === "login") && (
                <button
                  type="button"
                  className="p-1 rounded-full hover:bg-gray-100 transition"
                  onClick={() => setStep("email")}
                >
                  <span className="sr-only">Go back</span>
                  <svg fill="#232323" width="20" height="20" viewBox="0 0 32 32">
                    <path fillRule="evenodd" d="M14.707 6.293a1 1 0 0 1 0 1.414L7.414 15H27a1 1 0 1 1 0 2H7.414l7.293 7.293a1 1 0 0 1-1.414 1.414l-9-9a1 1 0 0 1 0-1.414l9-9a1 1 0 0 1 1.414 0" clipRule="evenodd"></path>
                  </svg>
                </button>
              )}
              {/* Title left-aligned for email/signup, hidden for login */}
              <div className="flex-1 text-left">
                {step === "email" && (
                  <p className="text-2xl font-semibold text-[#141414] text-left" id="auth-modal-title">
                    Log in or sign up
                  </p>
                )}
                {/* No title for login or welcome back */}
              </div>
              <button
                id="button-close-modal-authmodal-header"
                aria-labelledby="label-close-modal-authmodal-header"
                className="p-1 rounded-full hover:bg-gray-100 transition"
                type="button"
                aria-pressed="false"
                aria-live="polite"
                onClick={onClose}
                style={{ lineHeight: 0 }}
              >
                <span id="label-close-modal-authmodal-header" className="sr-only">Close modal</span>
                <span aria-hidden="true">
                  <svg fill="#232323" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="18" height="18">
                    <path fillRule="evenodd" d="M5.293 5.293a1 1 0 0 1 1.414 0L10 8.586l3.293-3.293a1 1 0 1 1 1.414 1.414L11.414 10l3.293 3.293a1 1 0 0 1-1.414 1.414L10 11.414l-3.293 3.293a1 1 0 0 1-1.414-1.414L8.586 10 5.293 6.707a1 1 0 0 1 0-1.414" clipRule="evenodd"></path>
                  </svg>
                </span>
              </button>
            </div>
            {/* Body */}
            <div className="px-6 pb-6" style={{ overflow: "visible" }}>
              <AnimatePresence mode="wait">
                {loading ? (
                  <Loader />
                ) : (
                  <>
                    {step === "email" && (
                      <motion.div
                        key="email-step"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.18 }}
                        className="flex flex-col gap-4"
                      >
                        <div className="flex flex-col gap-2 pt-2 pb-4">
                          <p className="text-sm text-[#7B8487]">Log in or sign up to complete your booking</p>
                        </div>
                        <div className="flex flex-col gap-4 mt-2">
                          {/* Social login buttons */}
                          <button
                            id="button-facebook-login"
                            data-qa="facebook-login"
                            className="flex items-center gap-3 px-4 py-3 rounded-full font-semibold bg-white border border-[#d1d5db] hover:bg-gray-50 transition"
                            type="button"
                            aria-pressed="false"
                            aria-labelledby="label-facebook-login"
                            aria-live="polite"
                            onClick={() => handleSocialLogin("facebook")}
                            disabled={loading}
                          >
                            <span>
                              <img src="/socials/facebook.svg" alt="Facebook logo" className="h-6" />
                            </span>
                            <span id="label-facebook-login" className="font-semibold text-base text-[#141414]">Continue with Facebook</span>
                          </button>
                          {/* Custom Google button that triggers One Tap prompt */}
                          <button
                            id="button-google-login"
                            data-qa="google-login"
                            className="flex items-center gap-3 px-4 py-3 rounded-full font-semibold bg-white border border-[#d1d5db] hover:bg-gray-50 transition"
                            type="button"
                            aria-pressed="false"
                            aria-labelledby="label-google-login"
                            aria-live="polite"
                            onClick={handleGoogleContinue}
                            disabled={loading}
                          >
                            <span>
                              <img src="/socials/google.svg" alt="Google logo" className="h-6" />
                            </span>
                            <span id="label-google-login" className="font-semibold text-base text-[#141414]">Continue with Google</span>
                          </button>
                          {/* No hidden Google button or One Tap config rendered */}
                        </div>
                        {/* Separator */}
                        <div className="flex items-center gap-2">
                          <span className="flex-1 h-px bg-[#ededed]" />
                          <span className="text-xs text-[#7B8487] font-medium">OR</span>
                          <span className="flex-1 h-px bg-[#ededed]" />
                        </div>
                        {/* Error message */}
                        {errorMsg && (
                          <div className="mb-2 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{errorMsg}</div>
                        )}
                        {/* Email form */}
                        <form className="flex flex-col gap-4" onSubmit={handleEmailSubmit} noValidate>
                          <div>
                            <label htmlFor="authmodal-email" className="text-sm font-semibold text-[#232323]">Email <span className="text-[#232323]">*</span></label>
                            <input
                              id="authmodal-email"
                              name="email"
                              type="email"
                              autoComplete="email"
                              required
                              placeholder="Email address"
                              className="w-full border rounded-lg p-3 text-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#33383C]"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              disabled={loading}
                            />
                          </div>
                          <button
                            id="button-authmodal-continue"
                            type="submit"
                            data-qa="mobile-continue-button"
                            className="py-2 px-8 rounded-full font-semibold text-base bg-[#33383C] text-white hover:bg-[#232323] transition"
                            aria-pressed="false"
                            aria-labelledby="label-authmodal-continue"
                            aria-live="polite"
                            disabled={loading}
                          >
                            <span id="label-authmodal-continue" className="font-semibold">Continue</span>
                          </button>
                        </form>
                      </motion.div>
                    )}
                    {step === "signup" && (
                      <motion.div
                        key="signup-step"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.18 }}
                        className="flex flex-col gap-4"
                      >
                        <div className="flex flex-col gap-2 pt-2 pb-4">
                          <p className="text-lg font-semibold text-[#141414]">Create account</p>
                          <p className="text-sm text-[#7B8487]">Create your new account for <span className="font-medium">{email}</span> by completing these details</p>
                        </div>
                        {/* Error message */}
                        {errorMsg && (
                          <div className="mb-2 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{errorMsg}</div>
                        )}
                        <form className="flex flex-col gap-4" onSubmit={handleSignupSubmit} noValidate>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label htmlFor="firstName" className="text-sm font-semibold text-[#232323]">First name <span className="text-[#232323]">*</span></label>
                              <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                autoComplete="given-name"
                                required
                                className="w-full border rounded-lg p-3 text-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#33383C]"
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                disabled={loading}
                              />
                            </div>
                            <div className="flex-1">
                              <label htmlFor="lastName" className="text-sm font-semibold text-[#232323]">Last name <span className="text-[#232323]">*</span></label>
                              <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                autoComplete="family-name"
                                required
                                className="w-full border rounded-lg p-3 text-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#33383C]"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                disabled={loading}
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="password" className="text-sm font-semibold text-[#232323]">Password <span className="text-[#232323]">*</span></label>
                            <input
                              id="password"
                              name="password"
                              type="password"
                              autoComplete="new-password"
                              required
                              className="w-full border rounded-lg p-3 text-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#33383C]"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              disabled={loading}
                            />
                          </div>
                          {/* Replace old phone input with PhoneInput */}
                          <div>
                            <label htmlFor="phone" className="text-sm font-semibold text-[#232323]">Mobile number</label>
                            <PhoneInput
                              id="phone"
                              name="phone"
                              placeholder="Enter phone number"
                              defaultCountry="ZA"
                              value={phone}
                              onChange={setPhone}
                              disabled={loading}
                              international
                              countrySelectProps={{
                                className:
                                  "border rounded-lg p-3 bg-white text-[#141414] focus:outline-none focus:ring-1 focus:ring-[#33383C] mr-2",
                                style: { minWidth: 90, maxWidth: 140, height: 48 }
                              }}
                              className="flex items-center gap-2"
                            />
                            {/* Small style override for react-phone-number-input */}
                            <style jsx global>{`
                              .PhoneInput {
                                width: 100%;
                              }
                              .PhoneInputInput {
                                flex: 1 1 0%;
                                border: 1px solid #d1d5db;
                                border-radius: 0.5rem;
                                padding: 0.75rem;
                                background: #fff;
                                color: #141414;
                                font-size: 1rem;
                                height: 48px;
                              }
                              .PhoneInputInput:focus {
                                outline: none;
                                box-shadow: 0 0 0 1px #33383C;
                              }
                              .PhoneInputCountrySelect {
                                border-radius: 0.5rem;
                                border: 1px solid #d1d5db;
                                background: #fff;
                                color: #141414;
                                padding: 0.75rem 2.5rem 0.75rem 0.75rem;
                                font-size: 1rem;
                                height: 48px;
                                margin-right: 0.5rem;
                                appearance: none;
                                -webkit-appearance: none;
                                -moz-appearance: none;
                                --PhoneInputCountrySelectArrow-color: #232323;
                              }
                              .PhoneInputCountry {
                                margin-right: 0.5rem;
                              }
                            `}</style>
                          </div>
                          {/* Replace agreement with email marketing opt-in */}
                          <div className="flex items-center gap-2">
                            <input
                              id="marketing"
                              name="marketing"
                              type="checkbox"
                              checked={agreement}
                              onChange={e => setAgreement(e.target.checked)}
                              className="accent-[#33383C]"
                              disabled={loading}
                            />
                            <label htmlFor="marketing" className="text-sm text-[#232323]">
                              I want to receive news, offers and marketing emails from Bel Amour.
                            </label>
                          </div>
                          <button
                            type="submit"
                            className="py-2 px-8 rounded-full font-semibold text-base bg-[#33383C] text-white hover:bg-[#232323] transition"
                            disabled={loading}
                          >
                            Continue
                          </button>
                        </form>
                      </motion.div>
                    )}
                    {step === "login" && (
                      <motion.div
                        key="login-step"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 0 }}
                        transition={{ duration: 0.18 }}
                        className="flex flex-col gap-4"
                      >
                        {/* No title at the top for login or welcome back */}
                        <div className="flex flex-col gap-2 pt-2 pb-4">
                          <p className="text-lg font-semibold text-[#141414]">Welcome back</p>
                          <p className="text-sm text-[#7B8487]">Enter your password to log in as <span className="font-medium">{email}</span></p>
                        </div>
                        {errorMsg && (
                          <div className="mb-2 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{errorMsg}</div>
                        )}
                        <form className="flex flex-col gap-4" onSubmit={handleLoginSubmit} noValidate>
                          <div>
                            <label htmlFor="login-password" className="text-sm font-semibold text-[#232323]">Password</label>
                            <input
                              id="login-password"
                              name="login-password"
                              type="password"
                              autoComplete="current-password"
                              required
                              className="w-full border rounded-lg p-3 text-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#33383C]"
                              value={loginPassword}
                              onChange={e => setLoginPassword(e.target.value)}
                              disabled={loading}
                            />
                          </div>
                          <button
                            type="submit"
                            className="py-2 px-8 rounded-full font-semibold text-base bg-[#33383C] text-white hover:bg-[#232323] transition"
                            disabled={loading}
                          >
                            Continue
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

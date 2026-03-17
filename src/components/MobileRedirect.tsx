"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  isLoggedIn: boolean;
};

function isMobileUserAgent(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

export function MobileRedirect({ isLoggedIn }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) return;
    if (isMobileUserAgent() || isMobileViewport()) {
      router.replace("/flows");
    }
  }, [isLoggedIn, router]);

  return null;
}

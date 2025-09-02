"use client";

export function useYahooAuth() {
  return () => {
    const uid = localStorage.getItem("uid") ?? crypto.randomUUID();
    localStorage.setItem("uid", uid);
    const url = `/api/auth/yahoo?userId=${encodeURIComponent(uid)}`;
    window.location.href = url;
    return { uid, url };
  };
}

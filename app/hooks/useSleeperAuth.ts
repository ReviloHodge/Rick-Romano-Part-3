"use client";

export function useSleeperAuth() {
  return () => {
    const uid = localStorage.getItem("uid") ?? crypto.randomUUID();
    localStorage.setItem("uid", uid);
    const url = "/dashboard?provider=sleeper";
    window.location.href = url;
    return { uid, url };
  };
}

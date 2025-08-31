"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SleeperLeagueForm from "./SleeperLeagueForm";

export default function Dashboard() {
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setProvider(search.get("provider"));
  }, []);

  const handleYahoo = () => {
    const uid =
      window.localStorage.getItem("uid") ?? crypto.randomUUID();
    window.localStorage.setItem("uid", uid);
    window.location.href = `/api/auth/yahoo?userId=${encodeURIComponent(
      uid
    )}`;
  };

  return (
    <main className="mi

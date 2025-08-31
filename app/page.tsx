"use client";

export default function Home() {
  const handleYahoo = () => {
    const uid = localStorage.getItem("uid") ?? crypto.randomUUID();
    localStorage.setItem("uid", uid);
    window.location.href = `/api/auth/yahoo?userId=${encodeURIComponent(uid)}`;
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="container text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold">
          Your League. Your Drama. Rick Tells It Like It Is.
        </h1>
        <p className="text-lg text-gray-600"

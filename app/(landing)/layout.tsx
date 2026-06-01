import Link from "next/link";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex text-xl items-center gap-2 self-center font-bold">
          <img alt="Oppr Logo" className="h-8 w-8" src="/logo.png" />
          Oppr Insights
        </Link>
        {children}
        <div className="flex items-center justify-center">
          <span className="font-normal">Powered by</span>
          <Link href="https://www.oppr.ai" target="_blank" className="ms-1 font-semibold text-primary">Oppr.ai</Link>
        </div>
      </div>
    </div>
  );
}

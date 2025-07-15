import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import logo from '@/assets/images/logo.png';

interface PublicLayoutProps {
  children: React.ReactNode;
  backTo?: string;
  backToText?: string;
}

export default function PublicLayout({ children, backTo, backToText }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <img src={logo} alt="Logo" className="h-8 w-auto" />
          </Link>
          {backTo && (
            <Link href={backTo}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backToText || "Back"}
              </Button>
            </Link>
          )}
        </div>
      </header>
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}

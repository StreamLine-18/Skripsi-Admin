import { Search, Menu, LogOutIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const logout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-slate-200">
      {/* Mobile menu button */}
      <button
        type="button"
        className="md:hidden h-16 w-16 border-r border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-950 focus:outline-none transition-colors"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 mx-auto" />
      </button>
      
      <div className="flex-1 px-6 flex justify-between items-center">
        {/* Search bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="w-full pl-10 pr-4 h-9 bg-slate-50 border-slate-200/60 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-300 transition-colors"
              placeholder="Search..."
              type="search"
            />
          </div>
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-slate-900 hover:text-slate-900 hover:bg-slate-100 transition-colors bg-slate-300/50" 
            onClick={logout}
            title="Logout"
          >
            <LogOutIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
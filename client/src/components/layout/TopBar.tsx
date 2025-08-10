import { Search, Bell, Menu, User, ChevronDown, LogOutIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {

    // Define the logout function
  const logout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      {/* Mobile menu button - only visible on mobile */}
      <button
        type="button"
        className="md:hidden h-16 w-16 border-r border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:bg-slate-100 flex items-center justify-center transition-colors"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="flex-1 px-4 flex justify-between items-center">
        {/* Search bar */}
        <div className="flex-1 max-w-lg">
          <div className="relative w-full text-slate-400 focus-within:text-slate-600">
            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
              <Search className="h-4 w-4 ml-3" />
            </div>
            <Input
              className="block w-full pl-10 pr-3 py-2 border-transparent text-slate-900 placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-0 focus:border-transparent"
              placeholder="Search..."
              type="search"
            />
          </div>
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50" 
            onClick={logout}
          >
            <LogOutIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
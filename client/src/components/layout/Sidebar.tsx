import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  Ticket, 
  ClipboardList,
  User as UserIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import logo from '@/assets/images/logo_white.png';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const navigationItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Users", href: "/users", icon: Users },
    { name: "Tickets", href: "/tickets", icon: Ticket },
    { name: "Bookings", href: "/bookings", icon: ClipboardList },
];

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const [location] = useLocation();

  const { data: getMeResponse } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    retry: false,
  });

  const user = getMeResponse?.data;

  const SidebarContent = () => (
    <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-sidebar">
      <div className="flex items-center flex-shrink-0 px-8">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="AdminPanel Logo" />
        </div>
      </div>
      
      <div className="mt-6 flex-1 flex flex-col">
        <nav className="flex-1 px-2 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "sidebar-nav-item group transition-all duration-200 ease-in-out transform hover:translate-x-1",
                  isActive && "active"
                )}
                onClick={isMobile ? onClose : undefined}
              >
                <Icon className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110" />
                <span className="transition-all duration-200">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="flex-shrink-0 flex flex-col border-t border-sidebar-border p-4 space-y-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <UserIcon className="w-4 h-4 text-sidebar-accent-foreground" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-sidebar-foreground">{user?.full_name || 'Admin User'}</p>
              <p className="text-xs font-medium text-sidebar-foreground">{user?.email || 'Loading...'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div
          className={cn(
            "fixed inset-0 bg-gray-900/80 z-40 transition-opacity duration-300 ease-in-out md:hidden",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar transform transition-transform duration-300 ease-in-out md:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="absolute top-2 right-0 -mr-14">
             <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white focus:outline-none focus:ring-2 focus:ring-white"
                onClick={onClose}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6" />
              </button>
          </div>
          <SidebarContent />
        </div>
      </>
    );
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col transform transition-transform duration-300 ease-in-out">
      <SidebarContent />
    </div>
  );
}

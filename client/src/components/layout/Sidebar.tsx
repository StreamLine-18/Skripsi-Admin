import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  Ticket, 
  ClipboardList,
  User as UserIcon,
  X,
  CalendarDays,
  DoorOpen,
  UsersRound,
  ChevronRight,
  Store,
  Newspaper,
  BarChart3,
  Megaphone,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import logo from '@/assets/images/logo.png'; // Using the white logo for better contrast
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const navigationMenu = [
  { name: "Dashboard", href: "/", icon: Home },
  {
    name: "Bookings",
    icon: ClipboardList,
    subItems: [
      { name: "Onsite Booking", href: "/onsite-booking", icon: Store },
      { name: "Bookings", href: "/bookings", icon: ClipboardList },
    ],
  },
  { name: "News", href: "/news", icon: Newspaper },
  { name: "Events", href: "/events", icon: CalendarDays },
  { name: "Destinations", href: "/destinations", icon: Home },
];

const servicesItems = [
  { name: "SKM", href: "/skm", icon: BarChart3 },
  { name: "Pengaduan Masyarakat", href: "/pengaduan", icon: Megaphone },
  { name: "WBS", href: "/wbs", icon: AlertTriangle },
];

const masterDataItems = [
  { name: "Ticket Prices", href: "/ticket-prices", icon: Ticket },
  { name: "Day Types", href: "/day-types", icon: CalendarDays },
  { name: "Gates", href: "/gates", icon: DoorOpen },
  { name: "Visitor Categories", href: "/visitor-categories", icon: UsersRound },
  { name: "Users", href: "/users", icon: Users },
]

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const [location] = useLocation();
  
  const defaultOpenMenu = navigationMenu.find(item => 
    item.subItems?.some(sub => location.startsWith(sub.href))
  )?.name || null;
  const [openMenu, setOpenMenu] = useState<string | null>(defaultOpenMenu);


  const { data: getMeResponse } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    retry: false,
  });

  const user = getMeResponse?.data;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo Section */}
      <div className="flex flex-col items-center justify-center px-6 pt-8 pb-6 border-b border-sidebar-border/50">
        <div className="relative">
          <div className="absolute inset-0 bg-sidebar-accent/20 blur-xl rounded-full"></div>
          <img src={logo} alt="Alas Purwo" className="relative h-20 w-20 object-contain drop-shadow-lg" />
        </div>
        <div className="mt-4 text-center">
          <h2 className="text-base font-semibold text-sidebar-foreground"> Taman Nasional Alas Purwo</h2>
          <p className="text-xs text-sidebar-foreground mt-0.5">Admin Panel</p>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="px-3 space-y-6">
          {/* Main Section */}
          <div className="space-y-1">
            <h3 className="px-3 text-[10px] font-semibold text-sidebar-foreground uppercase tracking-wider mb-2">
              Main
            </h3>
            {navigationMenu.map((item) => {
              const Icon = item.icon;
              const isParentActive = item.subItems?.some(sub => location === sub.href);

              if (item.subItems) {
                return (
                  <Collapsible 
                    key={item.name} 
                    open={openMenu === item.name} 
                    onOpenChange={() => setOpenMenu(openMenu === item.name ? null : item.name)}
                  >
                    <CollapsibleTrigger 
                      asChild
                    >
                      <button
                        className={cn(
                          "sidebar-nav-item group w-full",
                          isParentActive && "active"
                        )}
                      >
                        <div className="flex items-center">
                          <Icon className="w-4 h-4 mr-3" />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <ChevronRight 
                          className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            openMenu === item.name && "rotate-90"
                          )} 
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-7 space-y-1 mt-1">
                      {item.subItems.map(subItem => {
                        const SubIcon = subItem.icon;
                        const isSubActive = location === subItem.href;
                        return (
                          <Link 
                            key={subItem.name} 
                            href={subItem.href} 
                            className={cn(
                              "sidebar-nav-item group is-subitem",
                              isSubActive && "active"
                            )} 
                            onClick={isMobile ? onClose : undefined}
                          >
                            <SubIcon className="w-3.5 h-3.5 mr-3" />
                            <span className="text-sm">{subItem.name}</span>
                          </Link>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              }

              const isActive = location === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href} 
                  className={cn(
                    "sidebar-nav-item group",
                    isActive && "active"
                  )} 
                  onClick={isMobile ? onClose : undefined}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Services Section */}
          <div className="space-y-1">
            <h3 className="px-3 text-[10px] font-semibold text-sidebar-foreground uppercase tracking-wider mb-2">
              Services
            </h3>
            {servicesItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href} 
                  className={cn(
                    "sidebar-nav-item group",
                    isActive && "active"
                  )} 
                  onClick={isMobile ? onClose : undefined}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Master Data Section */}
          <div className="space-y-1">
            <h3 className="px-3 text-[10px] font-semibold text-sidebar-foreground uppercase tracking-wider mb-2">
              Master Data
            </h3>
            {masterDataItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href} 
                  className={cn(
                    "sidebar-nav-item group",
                    isActive && "active"
                  )} 
                  onClick={isMobile ? onClose : undefined}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
        
      {/* User Profile Section */}
      <div className="flex-shrink-0 border-t border-sidebar-border/50 p-4">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-4 h-4 text-sidebar-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.full_name || 'Admin User'}
            </p>
            <p className="text-xs text-sidebar-foreground truncate">
              {user?.email || 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className={cn(
            "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )} 
          onClick={onClose} 
          aria-hidden="true" 
        />
        
        {/* Mobile Sidebar */}
        <div 
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transform md:hidden transition-transform duration-300 ease-in-out shadow-2xl",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Close Button - Only visible when sidebar is open */}
          {isOpen && (
            <button 
              type="button" 
              className="absolute top-4 -right-12 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors" 
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-5 w-5" />
            </button>
          )}
          
          <SidebarContent />
        </div>
      </>
    );
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <SidebarContent />
    </div>
  );
}

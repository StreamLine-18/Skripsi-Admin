import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  Package, 
  Calendar, 
  Settings, 
  X,
  User as UserIcon,
  Images,
  NotebookPen,
  BookUser as LucideBookUser,
  HeartPulseIcon,
  Boxes,
  UserRound,
  UserRoundCheck,
  AwardIcon,
  MedalIcon,
  ChevronDown,
  Search,
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

const navigationSections = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", href: "/", icon: Home },
      { name: "Leaderboard", href: "/leaderboard/8bc1204a-39bb-40d7-b838-df2b8e9b87d4", icon: MedalIcon },
    ]
  },
  {
    title: "Content Management",
    items: [
      { name: "Banners", href: "/banner", icon: Images },
      { name: "Events", href: "/events", icon: Calendar },
      { name: "Product Category", href: "/products-category", icon: Boxes },
      { name: "Products", href: "/products", icon: Package },
    ]
  },
  {
    title: "Administration",
    items: [
      { name: "Users", href: "/users", icon: Users },
      { name: "Badge Type", href: "/badge-type", icon: AwardIcon },
      { name: "Team Management", href: "/team-management", icon: LucideBookUser },
    ]
  },
  {
    title: "Fi-Talk",
    items: [
      { name: "Participants", href: "/fitalk/participants", icon: UserRound },
      { name: "Attendances", href: "/fitalk/attendances", icon: UserRoundCheck },
    ]
  },
  {
    title: "System",
    items: [
      { name: "System Status", href: "/health-check", icon: HeartPulseIcon },
    ]
  }
];

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Main": true,
    "Content Management": true,
  });

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const { data: getMeResponse } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    retry: false,
  });

  const user = getMeResponse?.data;

  // UPDATED: The filtering logic now also checks section titles.
  const filteredSections = useMemo(() => {
    if (!searchTerm) {
      return navigationSections;
    }

    return navigationSections
      .map(section => {
        // First, filter the items within the section
        const filteredItems = section.items.filter(item =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // Return the section with its filtered items
        return { ...section, items: filteredItems };
      })
      .filter(section => {
        // Then, keep the section if its title matches OR if it still has items left
        const titleMatches = section.title.toLowerCase().includes(searchTerm.toLowerCase());
        return titleMatches || section.items.length > 0;
      });
  }, [searchTerm]);

  const SidebarContent = () => (
    <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-sidebar">
      <div className="flex items-center flex-shrink-0 px-8">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="AdminPanel Logo" />
        </div>
      </div>

      {/* <div className="px-4 mt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-sidebar-accent/10 border border-sidebar-border rounded-lg text-sidebar-foreground placeholder-sidebar-foreground/50 focus:outline-none focus:ring-2 focus:ring-sidebar-accent focus:border-transparent transition-all duration-200"
          />
        </div>
      </div> */}
      
      <div className="mt-6 flex-1 flex flex-col">
        <nav className="flex-1 px-2 space-y-1">
          {filteredSections.map((section) => (
            <div key={section.title} className="py-2">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between text-left px-3 py-2 rounded-md hover:bg-sidebar-accent/10 focus:outline-none transition-colors duration-200"
              >
                <h3 className="text-xs font-semibold text-sidebar-foreground tracking-wider">
                  {section.title}
                </h3>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-sidebar-foreground transform transition-transform duration-300 ease-in-out",
                    // When searching, all sections are expanded to show results
                    (openSections[section.title] || searchTerm) && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  (openSections[section.title] || searchTerm) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => {
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
                </div>
              </div>
            </div>
          ))}
          
          {searchTerm && filteredSections.length === 0 && (
            <div className="px-3 py-8 text-center">
              <p className="text-sidebar-foreground/50 text-sm">No menu items found</p>
            </div>
          )}
        </nav>
      </div>
      
      <div className="flex-shrink-0 flex flex-col border-t border-sidebar-border p-4 space-y-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <UserIcon className="w-4 h-4 text-sidebar-accent-foreground" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-sidebar-foreground">{user?.full_name || 'User'}</p>
              <p className="text-xs font-medium text-sidebar-foreground">{user?.email || 'Failed to Load'}</p>
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

import { useQuery } from "@tanstack/react-query";
import { Users, Package, Calendar, Boxes, Tag } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { DataTable } from "@/components/ui/data-table";
import { 
    productApi, 
    userApi, 
    eventApi, 
    teamApi,
    productCategoryApi
} from "@/lib/api";
import type { User, Event, Product, Team, ProductCategory } from "@/lib/api";
import { useMemo } from "react";

export default function Dashboard() {

  // --- Fetch all necessary data in parallel ---
  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({ 
    queryKey: ["users"], 
    queryFn: () => userApi.getUsers({ page_size: 9999 })  });
  const { data: productsResponse, isLoading: isLoadingProducts } = useQuery({ 
    queryKey: ["products"], 
    queryFn: () => productApi.getProducts({ page_size: 9999 }) 
  });
  const { data: eventsResponse, isLoading: isLoadingEvents } = useQuery({ queryKey: ["events"], queryFn: eventApi.getEvents });
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useQuery({ queryKey: ["productCategories"], queryFn: productCategoryApi.getProductCategories });
  const { data: teamsResponse, isLoading: isLoadingTeams } = useQuery({ queryKey: ["teams"], queryFn: teamApi.getTeams });

  // --- Calculate Stats ---
  const stats = useMemo(() => {
    const users = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
    const products = Array.isArray(productsResponse?.data) ? productsResponse.data : [];
    const events = Array.isArray(eventsResponse?.data) ? eventsResponse.data : [];
    const categories = Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : [];
    
    const now = new Date();
    const activeEvents = events.filter((event: Event) => {
        const startDate = new Date(event.start_date.split('/').reverse().join('-'));
        const endDate = new Date(event.end_date.split('/').reverse().join('-'));
        return startDate <= now && now <= endDate;
    }).length;

    return {
      totalUsers: users.length,
      totalProducts: products.length,
      activeEvents: activeEvents,
      totalCategories: categories.length,
    };
  }, [usersResponse, productsResponse, eventsResponse, categoriesResponse]);

  // --- Prepare data for tables ---
  const products: Product[] = Array.isArray(productsResponse?.data) ? productsResponse.data : [];
  const teams: Team[] = Array.isArray(teamsResponse?.data) ? teamsResponse.data : [];
  const categories: ProductCategory[] = Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : [];
  const events: Event[] = Array.isArray(eventsResponse?.data) ? eventsResponse.data : [];

  // Sort products by creation date and get the most recent ones
  const recentProducts = useMemo(() => {
    return products
      .sort((a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime())
      .slice(0, 5);
  }, [products]);

  // --- Create lookup maps for displaying names instead of IDs ---
  const teamMap = useMemo(() => new Map(teams.map(t => [t.id_team, t.name])), [teams]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id_category, c.name])), [categories]);
  const eventMap = useMemo(() => new Map(events.map(e => [e.id_event, e.name])), [events]);

  const productColumns = [
    {
      key: "name",
      label: "Product",
      render: (product: Product) => (
        <div className="flex items-center">
          <img src={product.image_urls[0]} alt={product.name} className="h-10 w-10 rounded-md object-cover bg-slate-200" onError={(e) => { e.currentTarget.src = "https://placehold.co/40x40/e2e8f0/64748b?text=P"; }} />
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{product.name}</div>
            {/* <div className="text-xs text-slate-500 font-mono">{product.id_product}</div> */}
          </div>
        </div>
      ),
    },
    {
      key: "team",
      label: "Team",
      render: (product: Product) => (
        <div className="flex items-center text-sm"><Users className="h-4 w-4 mr-2 text-muted-foreground" />{teamMap.get(product.id_team) || '...'}</div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (product: Product) => (
        <div className="flex items-center text-sm"><Tag className="h-4 w-4 mr-2 text-muted-foreground" />{categoryMap.get(product.id_category) || '...'}</div>
      ),
    },
    {
      key: "event",
      label: "Event",
      render: (product: Product) => (
        <div className="flex items-center text-sm"><Calendar className="h-4 w-4 mr-2 text-muted-foreground" />{eventMap.get(product.id_event) || '...'}</div>
      ),
    },
  ];
  
  const isLoading = isLoadingUsers || isLoadingProducts || isLoadingEvents || isLoadingCategories || isLoadingTeams;

  return (
    <div>
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back! Here's a summary of your application's activity.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            iconColor="bg-blue-500"
          />
          <StatsCard
            title="Total Products"
            value={stats.totalProducts}
            icon={Package}
            iconColor="bg-emerald-500"
          />
          <StatsCard
            title="Active Events"
            value={stats.activeEvents}
            icon={Calendar}
            iconColor="bg-amber-500"
          />
          <StatsCard
            title="Total Categories"
            value={stats.totalCategories}
            icon={Boxes}
            iconColor="bg-purple-500"
          />
        </div>
      </div>

      {/* Recent Products Table */}
      <div className="mt-8">
        <DataTable
          title="Recent Products"
          description="A list of the most recently submitted products."
          data={recentProducts.map(product => ({ ...product, id: product.id_product}))}
          columns={productColumns}
          searchPlaceholder="Search products..."
          loading={isLoadingProducts}
        />
      </div>
    </div>
  );
}

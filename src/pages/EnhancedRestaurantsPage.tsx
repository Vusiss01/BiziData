import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RestaurantForm from "@/components/restaurants/RestaurantForm";
import RestaurantList from "@/components/restaurants/RestaurantList";
import { useToast } from "@/components/ui/use-toast";
import { checkUserSynchronization } from "@/utils/diagnostics";
import { useDebounce } from "@/utils/uiUtils";
import useErrorHandler from "@/hooks/useErrorHandler";
import { ErrorCategory } from "@/utils/errorHandler";

const EnhancedRestaurantsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string[]>(["active", "pending_verification"]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Use our custom error handler
  const { handleAsync } = useErrorHandler({
    component: 'EnhancedRestaurantsPage',
    showToast: true,
  });

  const handleAddRestaurant = async () => {
    // Use our handleAsync utility for better error handling
    await handleAsync(
      async () => {
        // First check if the user is properly synchronized
        const syncStatus = await checkUserSynchronization();

        if (!syncStatus.synchronized) {
          toast({
            title: "User Synchronization Issue",
            description: "Your user account needs to be synchronized before creating a restaurant. Please visit the Debug page.",
            variant: "destructive",
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/debug")}
              >
                Go to Debug
              </Button>
            ),
          });
          return;
        }

        setIsAddDialogOpen(true);
        return syncStatus;
      },
      {
        action: 'checkUserSynchronization',
        category: ErrorCategory.AUTHENTICATION,
        userMessage: "Failed to check user synchronization. Please try again.",
      }
    );
  };

  const handleRestaurantCreated = () => {
    toast({
      title: "Success",
      description: "Restaurant created successfully",
    });

    // Force refresh of restaurant list by incrementing the key
    console.log('Refreshing restaurant list after creation');
    setRefreshKey(prev => prev + 1);

    // Close the dialog
    setIsAddDialogOpen(false);
  };

  const handleRestaurantClick = (restaurantId: string) => {
    // Navigate to restaurant details page
    toast({
      title: "Restaurant Selected",
      description: `Viewing restaurant ${restaurantId}`,
    });
    // navigate(`/restaurants/${restaurantId}`);
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Restaurants</h1>

        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2">
          {/* Search input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("active")}
                onCheckedChange={() => toggleStatusFilter("active")}
              >
                Active
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("pending_verification")}
                onCheckedChange={() => toggleStatusFilter("pending_verification")}
              >
                Pending
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("suspended")}
                onCheckedChange={() => toggleStatusFilter("suspended")}
              >
                Suspended
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Restaurant button */}
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={handleAddRestaurant}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Restaurant
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Restaurants</TabsTrigger>
          <TabsTrigger value="my">My Restaurants</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <RestaurantList
            key={`all-${refreshKey}-${debouncedSearchQuery}`}
            onRestaurantClick={handleRestaurantClick}
            searchQuery={debouncedSearchQuery}
            statusFilter={statusFilter}
          />
        </TabsContent>

        <TabsContent value="my" className="mt-6">
          <RestaurantList
            key={`my-${refreshKey}-${debouncedSearchQuery}`}
            showOwnerOnly={true}
            onRestaurantClick={handleRestaurantClick}
            searchQuery={debouncedSearchQuery}
            statusFilter={statusFilter}
          />
        </TabsContent>
      </Tabs>

      {/* Add Restaurant Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <RestaurantForm
            onClose={() => setIsAddDialogOpen(false)}
            onSuccess={handleRestaurantCreated}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedRestaurantsPage;

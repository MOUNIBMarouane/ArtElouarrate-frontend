import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Search, ArrowUpDown, Loader2 } from "lucide-react";
import { ArtworkWithCategory, Category } from "@/types/database";
import { useDeleteArtwork, useArtworks } from "@/hooks/useArtworks";
import { getImageUrl } from "@/lib/utils";
import ImageWithFallback from "./ImageWithFallback";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import ArtworkForm from "./ArtworkForm";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ArtworkListProps {
  categories: Category[];
}

const ArtworkList = ({ categories }: ArtworkListProps) => {
  // Search and filtering state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortField, setSortField] = useState<"updated" | "price" | "name">(
    "updated"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const ITEMS_PER_PAGE = 6;

  // State for editing
  const [selectedArtwork, setSelectedArtwork] =
    useState<ArtworkWithCategory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch artworks with search and pagination
  const {
    data: artworksData,
    isLoading,
    error,
  } = useArtworks({
    searchTerm: debouncedSearch,
    categoryId: categoryFilter,
    page,
    limit: ITEMS_PER_PAGE,
  });
  const deleteArtwork = useDeleteArtwork();

  // Handle search with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);

    // Reset to first page on new search
    if (page !== 1) setPage(1);

    // Debounce search to avoid too many API requests
    clearTimeout(Number(localStorage.getItem("searchTimeout")));
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(e.target.value);
    }, 300);
    localStorage.setItem("searchTimeout", String(timeoutId));
  };

  // Handle category filter change
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1); // Reset to first page on filter change
  };

  // Handle sorting
  const handleSortChange = (field: "updated" | "price" | "name") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Sorted and filtered artworks (client-side fallback)
  const artworks = useMemo(() => {
    return artworksData?.artworks || [];
  }, [artworksData]);

  // Calculate pagination details
  const pagination = artworksData?.pagination || {
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 1,
  };

  // Handle artwork edit
  const handleEdit = (artwork: ArtworkWithCategory) => {
    setSelectedArtwork(artwork);
    setIsFormOpen(true);
  };

  // Handle artwork delete
  const handleDelete = (id: string, name: string) => {
    if (
      window.confirm(`Are you sure you want to delete the artwork "${name}"?`)
    ) {
      deleteArtwork.mutate(id);
    }
  };

  // Handle image update
  const handleImageUpdate = (artworkId: string, imageUrl: string) => {
    // Refresh artworks list
    const queryKey = [
      "artworks",
      {
        searchTerm: debouncedSearch,
        categoryId: categoryFilter,
        page,
        limit: ITEMS_PER_PAGE,
      },
    ];
    // This will update automatically with React Query's invalidation
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const { totalPages } = pagination;

    // Add first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink isActive={page === 1} onClick={() => setPage(1)}>
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Add ellipsis if needed
    if (page > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Add pages around current page
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      if (i === 1 || i === totalPages) continue; // Skip first and last pages as they're handled separately
      items.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={page === i} onClick={() => setPage(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Add ellipsis if needed
    if (page < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Add last page if there are more than 1 pages
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink
            isActive={page === totalPages}
            onClick={() => setPage(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">
          Error loading artworks:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search artworks..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setIsFormOpen(true);
            setSelectedArtwork(null);
          }}
        >
          Add New Artwork
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
        </div>
      )}

      {/* No results state */}
      {!isLoading && artworks.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No artworks found</p>
          {(searchTerm || categoryFilter) && (
            <p className="text-gray-400">
              Try adjusting your search or filter to find more results
            </p>
          )}
        </div>
      )}

      {/* Artworks grid */}
      {!isLoading && artworks.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {artworks.map((artwork) => (
            <div
              key={artwork.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
            >
              <div className="relative aspect-[4/3] w-full bg-gray-100">
                <ImageWithFallback
                  imageUrl={artwork.images?.[0]?.url || ""}
                  altText={artwork.name}
                  className="object-cover w-full h-full"
                  artworkId={artwork.id}
                  onImageUpdated={handleImageUpdate}
                />
                <div className="absolute top-3 right-3 bg-white bg-opacity-80 px-2 py-1 rounded text-xs font-medium">
                  {artwork.status}
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                    {artwork.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: artwork.category?.color || "#CBD5E1",
                      }}
                    />
                    <p className="text-sm text-gray-600">
                      {artwork.category?.name || "Uncategorized"}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {artwork.description}
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">
                      {(artwork.price * 10).toLocaleString()} MAD
                    </p>
                    {artwork.originalPrice > artwork.price && (
                      <p className="text-xs text-gray-500 line-through">
                        {(artwork.originalPrice * 10).toLocaleString()} MAD
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Year: {artwork.year}
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(artwork)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(artwork.id, artwork.name)}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {getPaginationItems()}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < pagination.totalPages) setPage(page + 1);
                }}
                className={
                  page >= pagination.totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Artwork form dialog */}
      {isFormOpen && (
        <ArtworkForm
          artwork={selectedArtwork}
          categories={categories}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

export default ArtworkList;

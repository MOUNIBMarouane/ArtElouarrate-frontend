import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2 } from "lucide-react";
import ArtworkList from "@/components/art-management/ArtworkList";
import CategoryManager from "@/components/art-management/CategoryManager";
import ArtworkForm from "@/components/art-management/ArtworkForm";
import { useCategories } from "@/hooks/useCategories";
import { ArtworkWithCategory } from "@/types/database";

const ArtManagement = () => {
  const [isArtworkFormOpen, setIsArtworkFormOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] =
    useState<ArtworkWithCategory | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();

  const handleCloseForm = () => {
    setIsArtworkFormOpen(false);
    setEditingArtwork(null);
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 p-8 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="text-lg text-gray-600">Loading categories...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                ELOUARATE ART
              </h1>
              <p className="text-gray-600 mt-2">
                Professional Art Collection Management
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingArtwork(null);
                setIsArtworkFormOpen(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Artwork
            </Button>
          </div>

          <Tabs defaultValue="artworks" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100/50">
              <TabsTrigger
                value="artworks"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Artwork Collection
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Category Management
              </TabsTrigger>
            </TabsList>

            <TabsContent value="artworks" className="space-y-6">
              <ArtworkList categories={categories} />
            </TabsContent>

            <TabsContent value="categories">
              <CategoryManager categories={categories} />
            </TabsContent>
          </Tabs>
        </div>

        {isArtworkFormOpen && (
          <ArtworkForm
            artwork={editingArtwork}
            categories={categories}
            onClose={handleCloseForm}
          />
        )}
      </div>
    </div>
  );
};

export default ArtManagement;

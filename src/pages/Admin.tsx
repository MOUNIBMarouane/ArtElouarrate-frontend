import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Palette,
  LogOut,
  Users,
  Image,
  Plus,
  Edit,
  Trash2,
  Upload,
  Package,
  BarChart3,
  Search,
  Eye,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import api from "@/lib/api";

// Types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
  artworkCount: number;
  createdAt: string;
}

interface Artwork {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  medium: string;
  dimensions: string;
  year: number;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: number;
  image: string;
  viewCount: number;
  createdAt: string;
}

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [artworkDialog, setArtworkDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    color: "#667eea",
  });
  const [artworkForm, setArtworkForm] = useState({
    name: "",
    description: "",
    price: "",
    medium: "",
    dimensions: "",
    year: new Date().getFullYear(),
    categoryId: "",
    image: "",
    status: "AVAILABLE",
    isFeatured: false,
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, categoriesRes, artworksRes] = await Promise.all([
        api.getUsers().catch(() => ({ data: { users: [] } })),
        api.getCategories().catch(() => ({ data: { categories: [] } })),
        api.getArtworks().catch(() => ({ data: { artworks: [] } })),
      ]);

      setUsers((usersRes as any)?.data?.users || []);
      setCategories((categoriesRes as any)?.data?.categories || []);
      setArtworks(
        Array.isArray((artworksRes as any)?.data)
          ? (artworksRes as any)?.data
          : (artworksRes as any)?.data?.artworks || []
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Statistics
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    totalCategories: categories.length,
    totalArtworks: artworks.length,
    featuredArtworks: artworks.filter((a) => a.isFeatured).length,
    totalValue: artworks.reduce((sum, a) => sum + a.price, 0),
  };

  // Category CRUD
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, categoryForm);
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        await api.createCategory(categoryForm);
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }
      setCategoryDialog(false);
      setCategoryForm({ name: "", description: "", color: "#667eea" });
      setEditingCategory(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.deleteCategory(id);
      toast({ title: "Success", description: "Category deleted successfully" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  // Artwork CRUD
  const handleArtworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = {
        ...artworkForm,
        price: parseFloat(artworkForm.price),
        categoryId: parseInt(artworkForm.categoryId),
      };

      if (editingArtwork) {
        await api.updateArtwork(editingArtwork.id, formData);
        toast({
          title: "Success",
          description: "Artwork updated successfully",
        });
      } else {
        await api.createArtwork(formData);
        toast({
          title: "Success",
          description: "Artwork created successfully",
        });
      }
      setArtworkDialog(false);
      setArtworkForm({
        name: "",
        description: "",
        price: "",
        medium: "",
        dimensions: "",
        year: new Date().getFullYear(),
        categoryId: "",
        image: "",
        status: "AVAILABLE",
        isFeatured: false,
      });
      setEditingArtwork(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save artwork",
        variant: "destructive",
      });
    }
  };

  const handleDeleteArtwork = async (id: number) => {
    if (!confirm("Are you sure you want to delete this artwork?")) return;
    try {
      await api.deleteArtwork(id);
      toast({ title: "Success", description: "Artwork deleted successfully" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete artwork",
        variant: "destructive",
      });
    }
  };

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        "https://artelouarate-backend-production.up.railway.app/api/upload/image",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setArtworkForm((prev) => ({ ...prev, image: data.data.url }));
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Palette className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">
                ELOUARATE Admin
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                navigate("/admin/login");
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Package className="h-4 w-4 mr-2" />
              Categories ({categories.length})
            </TabsTrigger>
            <TabsTrigger value="artworks">
              <Image className="h-4 w-4 mr-2" />
              Artworks ({artworks.length})
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeUsers} active users
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Categories
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalCategories}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active categories
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Artworks
                  </CardTitle>
                  <Image className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalArtworks}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.featuredArtworks} featured
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your gallery content quickly
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button
                  onClick={() => {
                    setCategoryDialog(true);
                    setEditingCategory(null);
                    setCategoryForm({
                      name: "",
                      description: "",
                      color: "#667eea",
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
                <Button
                  onClick={() => {
                    setArtworkDialog(true);
                    setEditingArtwork(null);
                    setArtworkForm({
                      name: "",
                      description: "",
                      price: "",
                      medium: "",
                      dimensions: "",
                      year: new Date().getFullYear(),
                      categoryId: "",
                      image: "",
                      status: "AVAILABLE",
                      isFeatured: false,
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Artwork
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registered Users</CardTitle>
                <CardDescription>
                  View and manage registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter((user) =>
                        `${user.firstName} ${user.lastName} ${user.email}`
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      )
                      .map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={user.isActive ? "default" : "secondary"}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.isEmailVerified ? "default" : "secondary"
                              }
                            >
                              {user.isEmailVerified ? "Verified" : "Unverified"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>Manage artwork categories</CardDescription>
                </div>
                <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({
                          name: "",
                          description: "",
                          color: "#667eea",
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? "Edit Category" : "Add New Category"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCategorySubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={categoryForm.name}
                          onChange={(e) =>
                            setCategoryForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={categoryForm.description}
                          onChange={(e) =>
                            setCategoryForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="color">Color</Label>
                        <Input
                          id="color"
                          type="color"
                          value={categoryForm.color}
                          onChange={(e) =>
                            setCategoryForm((prev) => ({
                              ...prev,
                              color: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCategoryDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingCategory ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Card key={category.id} className="relative">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {category.name}
                            </CardTitle>
                            <CardDescription>
                              {category.description}
                            </CardDescription>
                          </div>
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-500 mb-4">
                          {category.artworkCount} artworks
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingCategory(category);
                              setCategoryForm({
                                name: category.name,
                                description: category.description,
                                color: category.color,
                              });
                              setCategoryDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Artworks Tab */}
          <TabsContent value="artworks" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Artworks</CardTitle>
                  <CardDescription>Manage your art collection</CardDescription>
                </div>
                <Dialog open={artworkDialog} onOpenChange={setArtworkDialog}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingArtwork(null);
                        setArtworkForm({
                          name: "",
                          description: "",
                          price: "",
                          medium: "",
                          dimensions: "",
                          year: new Date().getFullYear(),
                          categoryId: "",
                          image: "",
                          status: "AVAILABLE",
                          isFeatured: false,
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Artwork
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingArtwork ? "Edit Artwork" : "Add New Artwork"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleArtworkSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="artwork-name">Name</Label>
                          <Input
                            id="artwork-name"
                            value={artworkForm.name}
                            onChange={(e) =>
                              setArtworkForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="price">Price ($)</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={artworkForm.price}
                            onChange={(e) =>
                              setArtworkForm((prev) => ({
                                ...prev,
                                price: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="artwork-description">Description</Label>
                        <Textarea
                          id="artwork-description"
                          value={artworkForm.description}
                          onChange={(e) =>
                            setArtworkForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="medium">Medium</Label>
                          <Input
                            id="medium"
                            value={artworkForm.medium}
                            onChange={(e) =>
                              setArtworkForm((prev) => ({
                                ...prev,
                                medium: e.target.value,
                              }))
                            }
                            placeholder="Oil on Canvas"
                          />
                        </div>
                        <div>
                          <Label htmlFor="dimensions">Dimensions</Label>
                          <Input
                            id="dimensions"
                            value={artworkForm.dimensions}
                            onChange={(e) =>
                              setArtworkForm((prev) => ({
                                ...prev,
                                dimensions: e.target.value,
                              }))
                            }
                            placeholder="60x80cm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="year">Year</Label>
                          <Input
                            id="year"
                            type="number"
                            value={artworkForm.year}
                            onChange={(e) =>
                              setArtworkForm((prev) => ({
                                ...prev,
                                year: parseInt(e.target.value),
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={artworkForm.categoryId}
                            onValueChange={(value) =>
                              setArtworkForm((prev) => ({
                                ...prev,
                                categoryId: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id.toString()}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={artworkForm.status}
                            onValueChange={(value) =>
                              setArtworkForm((prev) => ({
                                ...prev,
                                status: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AVAILABLE">
                                Available
                              </SelectItem>
                              <SelectItem value="SOLD">Sold</SelectItem>
                              <SelectItem value="RESERVED">Reserved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="image-upload">Image</Label>
                        <div className="space-y-2">
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                          {artworkForm.image && (
                            <div className="relative w-full h-32">
                              <img
                                src={`https://artelouarate-backend-production.up.railway.app${artworkForm.image}`}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-md"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="featured"
                          checked={artworkForm.isFeatured}
                          onChange={(e) =>
                            setArtworkForm((prev) => ({
                              ...prev,
                              isFeatured: e.target.checked,
                            }))
                          }
                        />
                        <Label htmlFor="featured">Featured artwork</Label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setArtworkDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingArtwork ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {artworks.map((artwork) => (
                    <Card key={artwork.id} className="overflow-hidden">
                      <div className="relative h-48">
                        <img
                          src={
                            artwork.image.startsWith("http")
                              ? artwork.image
                              : `https://artelouarate-backend-production.up.railway.app${artwork.image}`
                          }
                          alt={artwork.name}
                          className="w-full h-full object-cover"
                        />
                        {artwork.isFeatured && (
                          <Badge className="absolute top-2 right-2 bg-yellow-500">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {artwork.name}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {artwork.description.slice(0, 100)}...
                            </CardDescription>
                          </div>
                          <Badge
                            variant={
                              artwork.status === "AVAILABLE"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {artwork.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500">
                            {artwork.medium} • {artwork.dimensions} •{" "}
                            {artwork.year}
                          </p>
                          <p className="text-lg font-semibold">
                            ${artwork.price}
                          </p>
                          <p className="text-xs text-gray-400">
                            {artwork.viewCount} views
                          </p>
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingArtwork(artwork);
                              setArtworkForm({
                                name: artwork.name,
                                description: artwork.description,
                                price: artwork.price.toString(),
                                medium: artwork.medium,
                                dimensions: artwork.dimensions,
                                year: artwork.year,
                                categoryId: artwork.categoryId.toString(),
                                image: artwork.image,
                                status: artwork.status,
                                isFeatured: artwork.isFeatured,
                              });
                              setArtworkDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteArtwork(artwork.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;

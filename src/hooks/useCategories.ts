import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { Category } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await api.categories.getAll();
        console.log('🔍 useCategories - API Response:', response);
        
        // Handle different response structures from backend
        let categories = [];
        if (response.data?.categories) {
          categories = response.data.categories;
        } else if (Array.isArray(response.data)) {
          categories = response.data;
        } else if (response.success && Array.isArray(response.data)) {
          categories = response.data;
        } else if (Array.isArray(response)) {
          categories = response;
        }
        
        // Sort categories by sortOrder and then by name
        categories.sort((a, b) => {
          if (a.sortOrder !== b.sortOrder) {
            return a.sortOrder - b.sortOrder;
          }
          return a.name.localeCompare(b.name);
        });
        
        console.log('🔍 Processed categories:', categories);
        return categories as Category[];
      } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

export const useAddCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.categories.create(category);
      return response.data;
    },
    onSuccess: (data) => {
      // Optimistic update to prevent full refetch
      queryClient.setQueryData(['categories'], (oldData: Category[] = []) => {
        return [...oldData, data as Category];
      });
      
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      toast({
        title: "Category created",
        description: "New category has been successfully added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create category. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating category:', error);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, category }: { id: string; category: Omit<Category, 'id' | 'created_at' | 'updated_at'> }) => {
      const response = await api.categories.update(id, category);
      return { id, ...response.data };
    },
    onSuccess: (updatedCategory) => {
      // Optimistic update to prevent full refetch
      queryClient.setQueryData(['categories'], (oldData: Category[] = []) => {
        return oldData.map(category => 
          category.id === updatedCategory.id ? { ...category, ...updatedCategory } : category
        );
      });
      
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      toast({
        title: "Category updated",
        description: "Category has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update category. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating category:', error);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.categories.delete(id);
      return { id, ...response };
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      
      // Snapshot previous value
      const previousCategories = queryClient.getQueryData<Category[]>(['categories']);
      
      // Optimistically update categories
      queryClient.setQueryData(['categories'], (oldData: Category[] = []) => {
        return oldData.filter(category => category.id !== id);
      });
      
      return { previousCategories };
    },
    onSuccess: (_, id) => {
      // We already optimistically updated, so just make sure the data is fresh
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['artworks'] }); // Refresh artworks as they might be affected
      
      toast({
        title: "Category deleted",
        description: "Category has been successfully removed.",
      });
    },
    onError: (error: any, _, context: any) => {
      // Restore previous state if there was an error
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories'], context.previousCategories);
      }
      
      let errorMessage = "Failed to delete category. Please try again.";
      
      // Extract specific error message from the API response
      if (error?.message) {
        if (error.message.includes("artworks")) {
          errorMessage = "Cannot delete category that contains artworks. Please move or delete the artworks first.";
        } else if (error.message.includes("Category has artworks")) {
          errorMessage = "This category contains artworks. Please move them to another category or delete them first.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Cannot Delete Category",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error deleting category:', error);
    },
  });
};

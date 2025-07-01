import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import api, { Artwork } from '@/lib/api';
import { ArtworkWithCategory } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface UseArtworksOptions {
  searchTerm?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export const useArtworks = (options: UseArtworksOptions = {}) => {
  const { 
    searchTerm = '', 
    categoryId = '', 
    page = 1, 
    limit = 12, 
    enabled = true 
  } = options;

  return useQuery({
    queryKey: ['artworks', { searchTerm, categoryId, page, limit }],
    queryFn: async () => {
      try {
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append('search', searchTerm);
        if (categoryId) queryParams.append('category', categoryId);
        if (page) queryParams.append('page', page.toString());
        if (limit) queryParams.append('limit', limit.toString());
        
        // Make API request
        const response = await api.artworks.getAll(queryParams.toString());
        
        // Handle response
        const artworks = response.data?.artworks || [];
        const pagination = response.data?.pagination || { 
          page, limit, total: artworks.length, totalPages: 1 
        };
        
        return { artworks, pagination };
      } catch (error) {
        console.error('Error fetching artworks:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    enabled,
  });
};

export const useArtwork = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['artwork', id],
    queryFn: async () => {
      if (!id) throw new Error('Artwork ID is required');
      const response = await api.artworks.getById(id);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id && enabled,
  });
};

export const useAddArtwork = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (artwork: Omit<Artwork, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.artworks.create(artwork);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      toast({
        title: "Artwork created",
        description: "New artwork has been successfully added.",
      });
      
      return data;
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to create artwork. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error creating artwork:', error);
    },
  });
};

export const useUpdateArtwork = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, artwork }: { id: string; artwork: any }) => {
      const response = await api.artworks.update(id, artwork);
      return { id, ...response.data };
    },
    onMutate: async ({ id, artwork }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['artwork', id] });
      await queryClient.cancelQueries({ queryKey: ['artworks'] });
      
      // Snapshot the previous value
      const previousArtwork = queryClient.getQueryData(['artwork', id]);
      
      // Optimistically update to the new value
      if (previousArtwork) {
        queryClient.setQueryData(['artwork', id], (old: any) => ({
          ...old,
          ...artwork,
        }));
      }
      
      return { previousArtwork };
    },
    onSuccess: (updatedArtwork) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['artwork', updatedArtwork.id] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      toast({
        title: "Artwork updated",
        description: "Artwork has been successfully updated.",
      });
    },
    onError: (error: any, variables, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousArtwork) {
        queryClient.setQueryData(
          ['artwork', variables.id],
          context.previousArtwork
        );
      }
      
      let errorMessage = "Failed to update artwork. Please try again.";
      
      if (error?.response?.status === 404) {
        errorMessage = "Artwork not found. It may have been deleted.";
      } else if (error?.response?.status === 400) {
        errorMessage = "Invalid artwork data. Please check all fields.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      console.error('Error updating artwork:', error);
    },
  });
};

export const useDeleteArtwork = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.artworks.delete(id);
      return id;
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['artworks'] });
      
      // Snapshot previous value
      const previousArtworks = queryClient.getQueryData(['artworks']);
      
      // Optimistically remove the artwork
      queryClient.setQueryData(['artworks'], (old: any) => {
        if (!old?.artworks) return old;
        return {
          ...old,
          artworks: old.artworks.filter((artwork: any) => artwork.id !== id)
        };
      });
      
      return { previousArtworks };
    },
    onSuccess: (id) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.removeQueries({ queryKey: ['artwork', id] });
      
      toast({
        title: "Artwork deleted",
        description: "Artwork has been successfully removed.",
      });
    },
    onError: (error: any, id, context: any) => {
      // Restore previous state if there was an error
      if (context?.previousArtworks) {
        queryClient.setQueryData(['artworks'], context.previousArtworks);
      }
      
      toast({
        title: "Error",
        description: error?.message || "Failed to delete artwork. Please try again.",
        variant: "destructive",
      });
      
      console.error('Error deleting artwork:', error);
    },
  });
};

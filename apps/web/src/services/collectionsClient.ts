import { createClient } from '@/lib/supabase/client';

export const dbClient = {
  library: {
    async getFolders() {
      const client = createClient();
      const { data, error } = await client.from('library_folders').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async createFolder(data: Record<string, unknown>) {
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: newFolder, error } = await client.from('library_folders').insert({...data, user_id: user.id}).select().single();
      if (error) throw error;
      return newFolder;
    },
    async deleteFolder(folderId: string) {
      const client = createClient();
      const { data, error } = await client.from('library_folders').delete().eq('id', folderId).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No se pudo eliminar la carpeta de la base de datos.");
    },
    async getItems() {
      const client = createClient();
      const { data, error } = await client.from('library_items').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async createItem(data: Record<string, unknown>) {
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: newItem, error } = await client.from('library_items').insert({...data, user_id: user.id}).select().single();
      if (error) throw error;
      return newItem;
    },
    async updateItem(itemId: string, data: Record<string, unknown>) {
      const client = createClient();
      const { data: updated, error } = await client.from('library_items').update(data).eq('id', itemId).select().single();
      if (error) throw error;
      return updated;
    },
    async deleteItem(itemId: string) {
      const client = createClient();
      const { data, error } = await client.from('library_items').delete().eq('id', itemId).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No se pudo eliminar la imagen de la base de datos.");
    }
  },
  collections: {
    async getCollections() {
      const client = createClient();
      const { data, error } = await client.from('collections').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async createCollection(data: Record<string, unknown>) {
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: newCollection, error } = await client.from('collections').insert({...data, user_id: user.id}).select().single();
      if (error) throw error;
      return newCollection;
    },
    async updateCollection(collectionId: string, data: Record<string, unknown>) {
      const client = createClient();
      const { data: updated, error } = await client.from('collections').update(data).eq('id', collectionId).select().single();
      if (error) throw error;
      return updated;
    },
    async deleteCollection(collectionId: string) {
      const client = createClient();
      const { error } = await client.from('collections').delete().eq('id', collectionId);
      if (error) throw error;
    }
  }
};

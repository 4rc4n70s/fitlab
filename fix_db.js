const fs = require('fs');
let content = fs.readFileSync('apps/web/src/services/db.ts', 'utf8');

const replacement = `  library: {
    async getFolders(options) {
      const client = getClient(options?.admin);
      const { data, error } = await client.from('library_folders').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async createFolder(data, options) {
      const client = getClient(options?.admin);
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: newFolder, error } = await client.from('library_folders').insert({...data, user_id: user.id}).select().single();
      if (error) throw error;
      return newFolder;
    },
    async deleteFolder(folderId, options) {
      const client = getClient(options?.admin);
      const { error } = await client.from('library_folders').delete().eq('id', folderId);
      if (error) throw error;
    },
    async getItems(options) {
      const client = getClient(options?.admin);
      const { data, error } = await client.from('library_items').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async createItem(data, options) {
      const client = getClient(options?.admin);
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: newItem, error } = await client.from('library_items').insert({...data, user_id: user.id}).select().single();
      if (error) throw error;
      return newItem;
    },
    async deleteItem(itemId, options) {
      const client = getClient(options?.admin);
      const { error } = await client.from('library_items').delete().eq('id', itemId);
      if (error) throw error;
    }
  },
  collections: {
    async getCollections(options) {
      const client = getClient(options?.admin);
      const { data, error } = await client.from('collections').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async createCollection(data, options) {
      const client = getClient(options?.admin);
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: newCollection, error } = await client.from('collections').insert({...data, user_id: user.id}).select().single();
      if (error) throw error;
      return newCollection;
    },
    async updateCollection(collectionId, data, options) {
      const client = getClient(options?.admin);
      const { data: updated, error } = await client.from('collections').update(data).eq('id', collectionId).select().single();
      if (error) throw error;
      return updated;
    },
    async deleteCollection(collectionId, options) {
      const client = getClient(options?.admin);
      const { error } = await client.from('collections').delete().eq('id', collectionId);
      if (error) throw error;
    }
  }
};`;

content = content.replace(/  library: \{[\s\S]*\}\n\};\n?$/, replacement);
fs.writeFileSync('apps/web/src/services/db.ts', content);

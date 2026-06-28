const fs = require('fs');
let content = fs.readFileSync('apps/web/src/services/db.ts', 'utf8');

const newCode = `
  library: {
    async getFolders(userId, options) {
      const client = getClient(options?.admin);
      const { data, error } = await client.from('library_folders').select('*').eq('user_id', userId).order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async createFolder(data, options) {
      const client = getClient(options?.admin);
      const { data: newFolder, error } = await client.from('library_folders').insert(data).select().single();
      if (error) throw error;
      return newFolder;
    },
    async deleteFolder(folderId, options) {
      const client = getClient(options?.admin);
      const { error } = await client.from('library_folders').delete().eq('id', folderId);
      if (error) throw error;
    },
    async getItems(userId, options) {
      const client = getClient(options?.admin);
      const { data, error } = await client.from('library_items').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async createItem(data, options) {
      const client = getClient(options?.admin);
      const { data: newItem, error } = await client.from('library_items').insert(data).select().single();
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
    async getCollections(userId, options) {
      const client = getClient(options?.admin);
      const { data, error } = await client.from('collections').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async createCollection(data, options) {
      const client = getClient(options?.admin);
      const { data: newCollection, error } = await client.from('collections').insert(data).select().single();
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
};
`;

content = content.replace(/  \}\n\};\n$/, '  },' + newCode);
fs.writeFileSync('apps/web/src/services/db.ts', content);

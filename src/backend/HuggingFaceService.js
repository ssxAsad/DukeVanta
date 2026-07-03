export class HuggingFaceService {
  /**
   * Queries the Hugging Face Hub for GGUF models matching the user's search.
   * Sorts by downloads to ensure stable, popular models surface first.
   */
  static async searchModels(query, limit = 15) {
    if (!query || query.trim() === '') return [];
    
    try {
      const endpoint = `https://huggingface.co/api/models?search=${encodeURIComponent(query)}&filter=gguf&sort=downloads&direction=-1&limit=${limit}`;
      const response = await fetch(endpoint);
      
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const data = await response.json();
      
      // Map the raw API response into a clean object for our React UI
      return data.map(repo => ({
        id: repo.modelId, 
        name: repo.modelId.split('/').pop(), 
        author: repo.author,
        downloads: repo.downloads,
        likes: repo.likes
      }));
      
    } catch (error) {
      console.error("[HuggingFace Service] Search Failed:", error);
      return [];
    }
  }

  /**
   * Once a user selects a repository, this fetches the actual file tree 
   * so we can list the available .gguf files (e.g., Q4_K_M vs Q8_0) and their sizes.
   */
  static async getModelFiles(modelId) {
    try {
      const endpoint = `https://huggingface.co/api/models/${modelId}/tree/main`;
      const response = await fetch(endpoint);
      
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const tree = await response.json();
      
      // Filter for actual model files and extract their sizes in GB
      const ggufFiles = tree
        .filter(file => file.path.endsWith('.gguf'))
        .map(file => ({
          filename: file.path,
          sizeGB: (file.size / (1024 * 1024 * 1024)).toFixed(2),
          url: `https://huggingface.co/${modelId}/resolve/main/${file.path}?download=true`
        }));
        
      return ggufFiles;
      
    } catch (error) {
      console.error("[HuggingFace Service] File Fetch Failed:", error);
      return [];
    }
  }
}
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const APP_SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_URL || '';

export async function uploadFiles(files: File[], folderId?: string) {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  if (folderId) formData.append('folderId', folderId);

  const response = await fetch(`${BACKEND_URL}/ingest`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}

export async function listFolders() {
  const response = await fetch(`${APP_SCRIPT_URL}?action=listTree`);
  
  if (!response.ok) {
    throw new Error('Failed to load folders');
  }

  return response.json();
}

export async function listFiles(folderId: string) {
  const response = await fetch(`${APP_SCRIPT_URL}?action=listFiles&folderId=${folderId}`);
  
  if (!response.ok) {
    throw new Error('Failed to load files');
  }

  return response.json();
}

export async function createFolder(name: string, parentId?: string) {
  const response = await fetch(`${APP_SCRIPT_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'createFolder',
      name,
      parentId
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create folder');
  }

  return response.json();
}

export async function askAI(query: string, fileIds?: string[]) {
  const response = await fetch(`${BACKEND_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, fileIds })
  });

  if (!response.ok) {
    throw new Error('AI search failed');
  }

  return response.json();
}

export async function searchDocuments(query: string, fileIds?: string[]) {
  const response = await fetch(`${BACKEND_URL}/search-multi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, fileIds })
  });

  if (!response.ok) {
    throw new Error('Document search failed');
  }

  return response.json();
}

export async function searchArchitecture(query: string, fileIds?: string[]) {
  const response = await fetch(`${BACKEND_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      query: `Find architecture and circuit diagrams: ${query}`,
      fileIds 
    })
  });

  if (!response.ok) {
    throw new Error('Architecture search failed');
  }

  return response.json();
}

export async function searchStructured(query: string, fileIds?: string[]) {
  const response = await fetch(`${BACKEND_URL}/ingest-json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      query,
      fileIds 
    })
  });

  if (!response.ok) {
    throw new Error('Structured search failed');
  }

  return response.json();
}

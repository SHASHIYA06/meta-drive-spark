const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const APP_SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_URL || '';

const REQUEST_TIMEOUT = 60000; // 60 seconds

// Fetch with timeout and retries
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - operation took too long');
    }
    throw error;
  }
}

export async function uploadFiles(files: File[], folderId?: string) {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  if (folderId) formData.append('folderId', folderId);

  const response = await fetchWithTimeout(`${BACKEND_URL}/ingest`, {
    method: 'POST',
    body: formData,
  }, 120000); // 2 minutes for upload

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Upload failed: ${response.statusText}`);
  }

  return response.json();
}

// Check job status
export async function checkJobStatus(jobId: string) {
  const response = await fetchWithTimeout(`${BACKEND_URL}/jobs/${jobId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Job check failed' }));
    throw new Error(error.error || 'Job check failed');
  }

  return response.json();
}

export async function listFolders() {
  const response = await fetchWithTimeout(`${APP_SCRIPT_URL}?action=listTree`, {});
  
  if (!response.ok) {
    throw new Error('Failed to load folders. Please check your Apps Script URL.');
  }

  return response.json();
}

export async function listFiles(folderId: string) {
  const response = await fetchWithTimeout(`${APP_SCRIPT_URL}?action=listFiles&folderId=${folderId}`, {});
  
  if (!response.ok) {
    throw new Error('Failed to load files from the selected folder.');
  }

  return response.json();
}

export async function createFolder(name: string, parentId?: string) {
  const response = await fetchWithTimeout(`${APP_SCRIPT_URL}`, {
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
    throw new Error('Failed to create folder. Please try again.');
  }

  return response.json();
}

export async function askAI(query: string, fileIds?: string[]) {
  try {
    console.log('🔍 Calling backend:', `${BACKEND_URL}/ask`);
    const response = await fetchWithTimeout(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, fileIds })
    }, 90000); // 90 seconds for AI queries

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'AI search failed' }));
      console.error('❌ Backend error:', error);
      throw new Error(error.error || 'AI search failed. Please try again.');
    }

    return response.json();
  } catch (error: any) {
    console.error('❌ Network error:', error.message);
    if (error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend at ${BACKEND_URL}. Please check your VITE_BACKEND_URL environment variable.`);
    }
    throw error;
  }
}

export async function searchDocuments(query: string, fileIds?: string[]) {
  try {
    console.log('🔍 Calling backend:', `${BACKEND_URL}/search-multi`);
    const response = await fetchWithTimeout(`${BACKEND_URL}/search-multi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, fileIds })
    }, 60000);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Document search failed' }));
      console.error('❌ Backend error:', error);
      throw new Error(error.error || 'Document search failed. Please try again.');
    }

    return response.json();
  } catch (error: any) {
    console.error('❌ Network error:', error.message);
    if (error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend at ${BACKEND_URL}. Please check your VITE_BACKEND_URL environment variable.`);
    }
    throw error;
  }
}

export async function searchArchitecture(query: string, fileIds?: string[]) {
  try {
    console.log('🔍 Calling backend:', `${BACKEND_URL}/ask (architecture)`);
    const response = await fetchWithTimeout(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: `Find architecture and circuit diagrams: ${query}`,
        fileIds 
      })
    }, 90000);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Architecture search failed' }));
      console.error('❌ Backend error:', error);
      throw new Error(error.error || 'Architecture search failed. Please try again.');
    }

    return response.json();
  } catch (error: any) {
    console.error('❌ Network error:', error.message);
    if (error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend at ${BACKEND_URL}. Please check your VITE_BACKEND_URL environment variable.`);
    }
    throw error;
  }
}

export async function searchStructured(query: string, fileIds?: string[]) {
  try {
    console.log('🔍 Calling backend:', `${BACKEND_URL}/search-multi (structured)`);
    const response = await fetchWithTimeout(`${BACKEND_URL}/search-multi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query,
        fileIds 
      })
    }, 60000);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Structured search failed' }));
      console.error('❌ Backend error:', error);
      throw new Error(error.error || 'Structured search failed. Please try again.');
    }

    return response.json();
  } catch (error: any) {
    console.error('❌ Network error:', error.message);
    if (error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend at ${BACKEND_URL}. Please check your VITE_BACKEND_URL environment variable.`);
    }
    throw error;
  }
}

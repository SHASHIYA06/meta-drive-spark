// KMRCL Metro Document Intelligence - Google Apps Script
// This script handles Google Drive operations and metadata management

const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID'; // Replace with your Sheet ID
const ROOT_FOLDER_ID = '1mjA3OiBaDX1-ins9Myr8QtU8esyyKkTG'; // Your Drive folder

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    if (action === 'listTree') {
      return listTree();
    } else if (action === 'listFiles') {
      const folderId = e.parameter.folderId;
      return listFiles(folderId);
    } else if (action === 'downloadBase64') {
      const fileId = e.parameter.fileId;
      return downloadBase64(fileId);
    } else {
      return ContentService.createTextOutput(
        JSON.stringify({ error: 'Invalid action' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'upload') {
      return uploadFile(data);
    } else if (action === 'createFolder') {
      return createFolder(data.name, data.parentId);
    } else if (action === 'search') {
      return searchMetadata(data.query);
    } else {
      return ContentService.createTextOutput(
        JSON.stringify({ error: 'Invalid action' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function listTree() {
  const folders = [];
  
  function traverse(folderId, path = '') {
    const folder = DriveApp.getFolderById(folderId);
    const folderName = folder.getName();
    const currentPath = path ? `${path}/${folderName}` : folderName;
    
    folders.push({
      id: folderId,
      name: folderName,
      path: currentPath
    });
    
    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
      const subfolder = subfolders.next();
      traverse(subfolder.getId(), currentPath);
    }
  }
  
  traverse(ROOT_FOLDER_ID);
  
  return ContentService.createTextOutput(
    JSON.stringify({ folders })
  ).setMimeType(ContentService.MimeType.JSON);
}

function listFiles(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = [];
  
  const fileIterator = folder.getFiles();
  while (fileIterator.hasNext()) {
    const file = fileIterator.next();
    files.push({
      id: file.getId(),
      name: file.getName(),
      mimeType: file.getMimeType(),
      size: file.getSize(),
      lastModified: file.getLastUpdated().toISOString(),
      url: file.getUrl()
    });
  }
  
  return ContentService.createTextOutput(
    JSON.stringify({ files })
  ).setMimeType(ContentService.MimeType.JSON);
}

function downloadBase64(fileId) {
  const file = DriveApp.getFileById(fileId);
  const blob = file.getBlob();
  const base64 = Utilities.base64Encode(blob.getBytes());
  
  return ContentService.createTextOutput(
    JSON.stringify({
      fileName: file.getName(),
      mimeType: file.getMimeType(),
      base64: base64
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function uploadFile(data) {
  const { fileName, base64Data, mimeType, folderId, system, subsystem } = data;
  
  // Decode base64 and create file
  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    mimeType,
    fileName
  );
  
  const folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getFolderById(ROOT_FOLDER_ID);
  const file = folder.createFile(blob);
  
  // Write metadata to Google Sheet
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  sheet.appendRow([
    new Date(),
    file.getId(),
    fileName,
    mimeType,
    file.getSize(),
    system || '',
    subsystem || '',
    file.getUrl()
  ]);
  
  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      fileId: file.getId(),
      fileUrl: file.getUrl()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function createFolder(name, parentId) {
  const parent = parentId ? DriveApp.getFolderById(parentId) : DriveApp.getFolderById(ROOT_FOLDER_ID);
  const folder = parent.createFolder(name);
  
  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      folderId: folder.getId(),
      folderName: folder.getName()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function searchMetadata(query) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const results = [];
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowString = row.join(' ').toLowerCase();
    
    if (rowString.includes(query.toLowerCase())) {
      results.push({
        date: row[0],
        fileId: row[1],
        fileName: row[2],
        mimeType: row[3],
        size: row[4],
        system: row[5],
        subsystem: row[6],
        url: row[7]
      });
    }
  }
  
  return ContentService.createTextOutput(
    JSON.stringify({ results })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Example usage of the Bookmarks API from a web client
 * Replace 'your-worker.workers.dev' with your actual worker URL
 */

const API_URL = 'https://your-worker.workers.dev';

// Example 1: Get all bookmarks
async function getAllBookmarks() {
  const response = await fetch(`${API_URL}/bookmarks`);
  const data = await response.json();
  console.log('All bookmarks:', data);
  return data;
}

// Example 2: Create a new bookmark
async function createBookmark() {
  const response = await fetch(`${API_URL}/bookmarks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'GitHub',
      url: 'https://droguier.com',
      description: 'Plataforma de desarrollo colaborativo',
      tags: ['desarrollo', 'git', 'código']
    })
  });
  const data = await response.json();
  console.log('Created bookmark:', data);
  return data;
}

// Example 3: Get a specific bookmark
async function getBookmark(id) {
  const response = await fetch(`${API_URL}/bookmarks/${id}`);
  const data = await response.json();
  console.log('Bookmark:', data);
  return data;
}

// Example 4: Update a bookmark
async function updateBookmark(id) {
  const response = await fetch(`${API_URL}/bookmarks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'GitHub - Actualizado',
      url: 'https://github.com',
      description: 'La mejor plataforma para desarrollo',
      tags: ['desarrollo', 'git', 'código', 'opensource']
    })
  });
  const data = await response.json();
  console.log('Updated bookmark:', data);
  return data;
}

// Example 5: Delete a bookmark
async function deleteBookmark(id) {
  const response = await fetch(`${API_URL}/bookmarks/${id}`, {
    method: 'DELETE'
  });
  const data = await response.json();
  console.log('Deleted bookmark:', data);
  return data;
}

// Example 6: Complete workflow
async function exampleWorkflow() {
  try {
    // Create a bookmark
    const created = await createBookmark();
    const bookmarkId = created.data.id;
    
    // Get all bookmarks
    await getAllBookmarks();
    
    // Get specific bookmark
    await getBookmark(bookmarkId);
    
    // Update the bookmark
    await updateBookmark(bookmarkId);
    
    // Delete the bookmark
    await deleteBookmark(bookmarkId);
    
    console.log('Workflow completed successfully!');
  } catch (error) {
    console.error('Error in workflow:', error);
  }
}

// Run the example workflow
// exampleWorkflow();

export default async function resetEverything(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch('/api/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to reset data');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error resetting everything:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
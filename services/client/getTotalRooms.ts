export default async function getTotalRooms(): Promise<number> {
  try {
    const response = await fetch('/api/room', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }

    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      return data.data.length;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching room count:', error);
    return 0;
  }
}
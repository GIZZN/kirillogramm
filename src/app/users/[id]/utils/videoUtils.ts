export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getVideoElement = (): HTMLVideoElement | null => {
  return document.querySelector('.highlight-video') as HTMLVideoElement;
};

export const handleSendMessage = async (userId: number, userName: string): Promise<void> => {
  try {
    const response = await fetch('/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        participantId: userId,
        name: userName
      })
    });

    if (response.ok) {
      const data = await response.json() as { message: string; chatId: number };
      window.location.href = `/messages?chat=${data.chatId}`;
    } else {
      window.location.href = `/messages`;
    }
  } catch (error) {
    console.error('Error creating chat:', error);
    window.location.href = `/messages`;
  }
};

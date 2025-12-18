export const copyToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy error', err);
    }
    document.body.removeChild(textArea);
  };

export const sendNotification = (title: string, body: string) => {
    if (window.Notification && Notification.permission === 'granted') {
      new Notification(title, { body, icon: "https://cdn-icons-png.flaticon.com/512/75/75806.png" });
    }
};

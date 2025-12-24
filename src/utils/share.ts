export interface ShareData {
  title: string;
  text: string;
  url: string;
}

export async function shareContent(data: ShareData): Promise<boolean> {
  // Check if Web Share API is available (mobile devices)
  if (navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
      return true;
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  }
  
  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(`${data.text}\n${data.url}`);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

export function getBarShareUrl(barId: number): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${window.location.pathname}?bar=${barId}`;
}

export function getCocktailShareUrl(cocktailId: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${window.location.pathname}?cocktail=${cocktailId}`;
}




import Share from 'react-native-share';

export interface ShareOptions {
  title?: string;
  message?: string;
  url: string;
}

export async function shareImage(options: ShareOptions): Promise<boolean> {
  try {
    const result = await Share.open({
      title: options.title || 'Share Photo',
      message: options.message || 'Check out this anonymized photo!',
      url: `file://${options.url}`,
      type: 'image/png',
    });

    return !!result;
  } catch (error: any) {
    // User cancelled sharing
    if (error?.message?.includes('User did not share')) {
      return false;
    }
    console.error('Share error:', error);
    return false;
  }
}

export async function shareToTwitter(imagePath: string): Promise<boolean> {
  try {
    await Share.open({
      url: `file://${imagePath}`,
      type: 'image/png',
      message: 'Anonymized with Anon Snap!',
    });
    return true;
  } catch (error: any) {
    if (error?.message?.includes('User did not share')) {
      return false;
    }
    console.error('Twitter share error:', error);
    return false;
  }
}

export async function shareToTelegram(imagePath: string): Promise<boolean> {
  try {
    await Share.shareSingle({
      social: Share.Social.TELEGRAM,
      url: `file://${imagePath}`,
      type: 'image/png',
      message: 'Anonymized with Anon Snap!',
    });
    return true;
  } catch (error) {
    console.error('Telegram share error:', error);
    return false;
  }
}

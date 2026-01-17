import Share from 'react-native-share';
import {Platform} from 'react-native';

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
      url: Platform.OS === 'android' ? `file://${options.url}` : options.url,
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
    await Share.shareSingle({
      social: Share.Social.TWITTER,
      url: Platform.OS === 'android' ? `file://${imagePath}` : imagePath,
      message: 'Anonymized with Anon Snap!',
    });
    return true;
  } catch (error) {
    console.error('Twitter share error:', error);
    return false;
  }
}

export async function shareToTelegram(imagePath: string): Promise<boolean> {
  try {
    await Share.shareSingle({
      social: Share.Social.TELEGRAM,
      url: Platform.OS === 'android' ? `file://${imagePath}` : imagePath,
      message: 'Anonymized with Anon Snap!',
    });
    return true;
  } catch (error) {
    console.error('Telegram share error:', error);
    return false;
  }
}

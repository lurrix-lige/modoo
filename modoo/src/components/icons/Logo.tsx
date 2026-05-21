import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { API_CONFIG } from '../../config/env';

interface LogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
  source?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export const Logo: React.FC<LogoProps> = ({
  size = 100,
  style,
  source = `${API_CONFIG.BASE_URL}/api/v1/images/logo.png`,
  resizeMode = 'contain',
}) => {
  const isRemoteUrl =
    typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'));

  const imageSource = isRemoteUrl ? { uri: source } : source;

  return (
    <Image
      source={imageSource}
      style={{
        width: size,
        height: size,
        resizeMode,
        ...(style as object),
      }}
    />
  );
};

export default Logo;

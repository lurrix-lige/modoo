import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { sharedStyles } from '../theme';

interface SafeAreaContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: readonly ('top' | 'right' | 'bottom' | 'left')[];
}

export function SafeAreaContainer({
  children,
  style,
  edges = ['top', 'left', 'right'],
}: SafeAreaContainerProps) {
  return (
    <RNSafeAreaView style={[sharedStyles.container, style]} edges={edges}>
      {children}
    </RNSafeAreaView>
  );
}

export default SafeAreaContainer;

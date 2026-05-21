import React from 'react';
import { View, StyleSheet } from 'react-native';
import { responsive } from '../theme';

interface ColumnsConfig {
  mobile?: number;
  tablet?: number;
  desktop?: number;
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: number | ColumnsConfig;
  gap?: number;
  style?: any;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  gap = 12,
  style,
}) => {
  let numColumns: number;

  const columnsConfig: ColumnsConfig =
    typeof columns === 'number' ? { mobile: columns, tablet: columns, desktop: columns } : columns;

  if (responsive.isLargeDesktop) {
    numColumns = columnsConfig.desktop || 4;
  } else if (responsive.isTablet) {
    numColumns = columnsConfig.tablet || 3;
  } else {
    numColumns = columnsConfig.mobile || 2;
  }

  return (
    <View style={[styles.container, style]}>
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={{
            width: `${100 / numColumns}%`,
            paddingRight: index % numColumns !== numColumns - 1 ? gap : 0,
            paddingBottom: gap,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default ResponsiveGrid;

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { responsive, sharedStyles } from '../theme';

interface TwoPaneLayoutProps {
  master: React.ReactNode;
  detail: React.ReactNode;
  defaultShowDetail?: boolean;
  onDetailClose?: () => void;
  masterWidth?: number;
  showDivider?: boolean;
}

export const TwoPaneLayout: React.FC<TwoPaneLayoutProps> = ({
  master,
  detail,
  defaultShowDetail = false,
  onDetailClose,
  masterWidth = 55,
  showDivider = true,
}) => {
  const [showDetailView, setShowDetailView] = useState(defaultShowDetail);
  const isTwoPane = responsive.isTablet && responsive.isLandscape;

  // Desktop/large tablet landscape mode - show both panes side by side
  if (isTwoPane) {
    return (
      <View style={styles.twoPaneContainer}>
        <View style={[styles.masterPane, { width: `${masterWidth}%` }]}>
          {master}
        </View>
        {showDivider && (
          <View style={styles.divider} />
        )}
        <View style={[styles.detailPane, { width: `${100 - masterWidth}%` }]}>
          {detail}
        </View>
      </View>
    );
  }

  // Mobile/portrait mode - show one pane at a time
  if (showDetailView) {
    return (
      <View style={styles.singlePaneContainer}>
        {detail}
      </View>
    );
  }

  return (
    <View style={styles.singlePaneContainer}>
      {master}
    </View>
  );
};

const styles = StyleSheet.create({
  twoPaneContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  masterPane: {
    flex: 1,
    overflow: 'hidden',
  },
  detailPane: {
    flex: 1,
    overflow: 'hidden',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
  },
  singlePaneContainer: {
    flex: 1,
  },
});

export default TwoPaneLayout;

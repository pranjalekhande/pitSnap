import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { CameraFilter, CAMERA_FILTERS } from './FilterConstants';

const { width: screenWidth } = Dimensions.get('window');

interface FilterSelectorProps {
  selectedFilter: CameraFilter;
  onFilterSelect: (filter: CameraFilter) => void;
  style?: any;
}

interface FilterItemProps {
  filter: CameraFilter;
  isSelected: boolean;
  onPress: () => void;
}

const FilterItem: React.FC<FilterItemProps> = ({ filter, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.filterItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Filter Preview Circle */}
      <View
        style={[
          styles.filterPreview,
          {
            backgroundColor: filter.previewColor,
            borderColor: isSelected ? '#FFFFFF' : 'transparent',
            borderWidth: isSelected ? 3 : 1,
          },
          filter.id === 'none' && {
            backgroundColor: 'transparent',
            borderColor: isSelected ? '#FFFFFF' : '#666666',
            borderWidth: 2,
          }
        ]}
      >
        {/* Add a subtle overlay for preview */}
        {filter.id !== 'none' && (
          <View
            style={[
              styles.filterPreviewOverlay,
              {
                backgroundColor: filter.overlayStyle.backgroundColor || 'transparent',
                opacity: (filter.overlayStyle.opacity as number) || 0.5,
              }
            ]}
          />
        )}
      </View>
      
      {/* Filter Name */}
      <Text style={[
        styles.filterName,
        isSelected && styles.filterNameSelected
      ]}>
        {filter.name}
      </Text>
    </TouchableOpacity>
  );
};

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  selectedFilter,
  onFilterSelect,
  style,
}) => {
  const renderFilterItem = ({ item }: { item: CameraFilter }) => (
    <FilterItem
      filter={item}
      isSelected={selectedFilter.id === item.id}
      onPress={() => onFilterSelect(item)}
    />
  );

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={CAMERA_FILTERS}
        renderItem={renderFilterItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 90,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 10,
  },
  filterList: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  filterItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  filterPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  filterPreviewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  filterName: {
    fontSize: 11,
    color: '#CCCCCC',
    textAlign: 'center',
    fontWeight: '500',
  },
  filterNameSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  separator: {
    width: 8,
  },
}); 
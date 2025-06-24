import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SnapchatFilter, SNAPCHAT_FILTERS, FILTER_CATEGORIES } from './SnapchatFilters';

const { width: screenWidth } = Dimensions.get('window');

interface SnapchatFilterSelectorProps {
  selectedFilter: SnapchatFilter;
  onFilterSelect: (filter: SnapchatFilter) => void;
  style?: any;
}

interface FilterItemProps {
  filter: SnapchatFilter;
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
      {/* Filter Preview */}
      <View
        style={[
          styles.filterPreview,
          {
            borderColor: isSelected ? '#E10600' : 'transparent',
            borderWidth: isSelected ? 3 : 1,
          },
          filter.id === 'none' && {
            backgroundColor: 'transparent',
            borderColor: isSelected ? '#E10600' : '#666666',
            borderWidth: 2,
          }
        ]}
      >
        {filter.id === 'none' ? (
          <Text style={styles.noFilterText}>OFF</Text>
        ) : (
          <Text style={styles.filterEmoji}>{filter.emoji}</Text>
        )}
        
        {/* Category indicator */}
        <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(filter.category) }]} />
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

const getCategoryColor = (category: SnapchatFilter['category']) => {
  switch (category) {
    case 'fun': return '#FF6B6B';
    case 'beauty': return '#FF69B4';
    case 'animals': return '#32CD32';
    case 'accessories': return '#1E90FF';
    default: return '#666666';
  }
};

export const SnapchatFilterSelector: React.FC<SnapchatFilterSelectorProps> = ({
  selectedFilter,
  onFilterSelect,
  style,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredFilters = selectedCategory === 'all' 
    ? SNAPCHAT_FILTERS 
    : SNAPCHAT_FILTERS.filter(filter => filter.category === selectedCategory || filter.id === 'none');

  const renderFilterItem = ({ item }: { item: SnapchatFilter }) => (
    <FilterItem
      filter={item}
      isSelected={selectedFilter.id === item.id}
      onPress={() => onFilterSelect(item)}
    />
  );

  const renderCategoryButton = (category: string, label: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.categoryButtonSelected
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === category && styles.categoryTextSelected
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>📸 Snapchat Filters</Text>
      </View>
      
      {/* Category Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryList}
      >
        {renderCategoryButton('all', '🌟 All')}
        {Object.entries(FILTER_CATEGORIES).map(([key, label]) => 
          renderCategoryButton(key, label)
        )}
      </ScrollView>
      
      {/* Filter List */}
      <FlatList
        data={filteredFilters}
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  categoryContainer: {
    maxHeight: 40,
    marginBottom: 10,
  },
  categoryList: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  categoryButtonSelected: {
    backgroundColor: '#E10600',
  },
  categoryText: {
    color: '#CCCCCC',
    fontSize: 11,
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  filterList: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  filterItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  filterPreview: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  filterEmoji: {
    fontSize: 28,
    textAlign: 'center',
  },
  noFilterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  categoryDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  filterName: {
    fontSize: 10,
    color: '#CCCCCC',
    textAlign: 'center',
    fontWeight: '500',
    width: 70,
  },
  filterNameSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  separator: {
    width: 8,
  },
}); 
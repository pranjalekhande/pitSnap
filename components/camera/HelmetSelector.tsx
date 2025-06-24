import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { HelmetOverlay, F1_HELMETS } from './HelmetConstants';

interface HelmetSelectorProps {
  selectedHelmet: HelmetOverlay;
  onHelmetSelect: (helmet: HelmetOverlay) => void;
  style?: any;
}

interface HelmetItemProps {
  helmet: HelmetOverlay;
  isSelected: boolean;
  onPress: () => void;
}

const HelmetItem: React.FC<HelmetItemProps> = ({ helmet, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.helmetItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Helmet Preview Circle */}
      <View
        style={[
          styles.helmetPreview,
          {
            borderColor: isSelected ? '#FFFFFF' : 'transparent',
            borderWidth: isSelected ? 3 : 1,
            backgroundColor: helmet.teamColor,
          },
          helmet.id === 'none' && {
            backgroundColor: 'transparent',
            borderColor: isSelected ? '#FFFFFF' : '#666666',
            borderWidth: 2,
          }
        ]}
      >
        {/* Helmet Emoji */}
        {helmet.emoji ? (
          <Text style={styles.helmetEmoji}>
            {helmet.emoji}
          </Text>
        ) : (
          <Text style={styles.noHelmetText}>OFF</Text>
        )}
      </View>
      
      {/* Helmet Name */}
      <Text style={[
        styles.helmetName,
        isSelected && styles.helmetNameSelected
      ]}>
        {helmet.name}
      </Text>
    </TouchableOpacity>
  );
};

export const HelmetSelector: React.FC<HelmetSelectorProps> = ({
  selectedHelmet,
  onHelmetSelect,
  style,
}) => {
  const renderHelmetItem = ({ item }: { item: HelmetOverlay }) => (
    <HelmetItem
      helmet={item}
      isSelected={selectedHelmet.id === item.id}
      onPress={() => onHelmetSelect(item)}
    />
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>🏎️ F1 Helmets</Text>
      </View>
      <FlatList
        data={F1_HELMETS}
        renderItem={renderHelmetItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.helmetList}
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
  helmetList: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  helmetItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  helmetPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  helmetEmoji: {
    fontSize: 24,
    textAlign: 'center',
  },
  noHelmetText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  helmetName: {
    fontSize: 10,
    color: '#CCCCCC',
    textAlign: 'center',
    fontWeight: '500',
  },
  helmetNameSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  separator: {
    width: 8,
  },
}); 
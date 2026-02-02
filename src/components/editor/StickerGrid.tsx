import React, {useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {BLUR_STICKER, STICKER_COLLECTIONS, StickerItem} from '../../data/stickerRegistry';
import {colors} from '../../theme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 12;
const NUM_COLUMNS = 4;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const THUMBNAIL_SIZE = 44;
const THUMBNAIL_GAP = 8;

interface StickerGridProps {
  onSelectSticker: (source: number, type: 'image' | 'blur') => void;
  selectedSource?: number;
  showSelectionHighlight?: boolean;
}

// All sections including blur as first
const ALL_SECTIONS = [
  {name: 'Blur', stickers: [BLUR_STICKER]},
  ...STICKER_COLLECTIONS,
];

const StickerGrid: React.FC<StickerGridProps> = ({
  onSelectSticker,
  selectedSource,
  showSelectionHighlight = false,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<{[key: string]: number}>({});
  const [activeSection, setActiveSection] = useState<string>('Blur');

  const handleSectionLayout = useCallback((sectionName: string, event: LayoutChangeEvent) => {
    sectionPositions.current[sectionName] = event.nativeEvent.layout.y;
  }, []);

  const scrollToSection = useCallback((sectionName: string) => {
    const yOffset = sectionPositions.current[sectionName] || 0;
    scrollViewRef.current?.scrollTo({y: yOffset, animated: true});
    setActiveSection(sectionName);
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;

    // Find which section is currently at the top
    let currentSection = 'Blur';
    const sections = Object.entries(sectionPositions.current).sort((a, b) => a[1] - b[1]);

    for (const [name, yPos] of sections) {
      if (scrollY >= yPos - 60) {
        currentSection = name;
      }
    }

    if (currentSection !== activeSection) {
      setActiveSection(currentSection);
    }
  }, [activeSection]);

  const renderNavItem = (section: {name: string; stickers: StickerItem[]}, index: number) => {
    const thumbnail = section.stickers[0];
    const isActive = activeSection === section.name;

    return (
      <TouchableOpacity
        key={section.name}
        style={[styles.navItem, isActive && styles.navItemActive]}
        onPress={() => scrollToSection(section.name)}
        activeOpacity={0.7}>
        <Image
          source={thumbnail.source}
          style={styles.navThumbnail}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  };

  const renderSticker = (sticker: StickerItem) => {
    const isSelected = showSelectionHighlight && selectedSource === sticker.source;

    return (
      <TouchableOpacity
        key={sticker.id}
        style={[
          styles.gridItem,
          isSelected && styles.gridItemSelected,
        ]}
        onPress={() => onSelectSticker(sticker.source, sticker.type)}
        activeOpacity={0.7}>
        <Image
          source={sticker.source}
          style={styles.stickerImage}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  };

  const renderSection = (section: {name: string; stickers: StickerItem[]}, index: number) => {
    return (
      <View
        key={section.name}
        onLayout={(event) => handleSectionLayout(section.name, event)}>
        <Text style={styles.sectionHeader}>{section.name.toUpperCase()}</Text>
        <View style={styles.stickerRow}>
          {section.stickers.map(renderSticker)}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Horizontal navigation bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.navBar}
        contentContainerStyle={styles.navBarContent}>
        {ALL_SECTIONS.map(renderNavItem)}
      </ScrollView>

      {/* Sectioned sticker grid */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        {ALL_SECTIONS.map(renderSection)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray700,
  },
  navBarContent: {
    flexDirection: 'row',
    paddingHorizontal: GRID_PADDING,
    paddingVertical: 8,
    gap: THUMBNAIL_GAP,
  },
  navItem: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    backgroundColor: colors.gray800,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  navItemActive: {
    borderColor: colors.white,
    backgroundColor: colors.gray700,
  },
  navThumbnail: {
    width: THUMBNAIL_SIZE - 8,
    height: THUMBNAIL_SIZE - 8,
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: GRID_PADDING,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray400,
    marginTop: 12,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  stickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 12,
    backgroundColor: colors.gray800,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridItemSelected: {
    borderColor: colors.white,
    backgroundColor: colors.gray700,
  },
  stickerImage: {
    width: ITEM_SIZE - 12,
    height: ITEM_SIZE - 12,
  },
});

export default StickerGrid;

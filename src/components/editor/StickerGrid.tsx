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
import {Shuffle} from 'lucide-react-native';
import {BLUR_STICKER, STICKER_COLLECTIONS, StickerItem} from '../../data/stickerRegistry';
import {colors} from '../../theme';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 12;
const NUM_COLUMNS = 4;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const THUMBNAIL_SIZE = 44;
const THUMBNAIL_GAP = 8;
const NAV_BAR_HEIGHT = 60;
// Calculate available height: 70% of screen minus header(~70px), nav bar, and bottom padding(~100px)
const GRID_MAX_HEIGHT = SCREEN_HEIGHT * 0.7 - 70 - NAV_BAR_HEIGHT - 100;

interface StickerGridProps {
  onSelectSticker: (source: number, type: 'image' | 'blur') => void;
  selectedSource?: number;
  showSelectionHighlight?: boolean;
  onRandomiseCollection?: (collectionName: string) => void;
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
  onRandomiseCollection,
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

  const renderNavItem = (section: {name: string; stickers: StickerItem[]}) => {
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
          fadeDuration={0}
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
          fadeDuration={0}
        />
      </TouchableOpacity>
    );
  };

  const renderSection = (section: {name: string; stickers: StickerItem[]}) => {
    const showRandomise = onRandomiseCollection && section.name !== 'Blur';
    return (
      <View
        key={section.name}
        onLayout={(event) => handleSectionLayout(section.name, event)}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>{section.name.toUpperCase()}</Text>
          {showRandomise && (
            <TouchableOpacity
              style={styles.randomiseButton}
              onPress={() => onRandomiseCollection(section.name)}
              activeOpacity={0.7}>
              <Shuffle size={11} color={colors.white} strokeWidth={2.5} />
              <Text style={styles.randomiseText}>Randomise</Text>
            </TouchableOpacity>
          )}
        </View>
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
        scrollEventThrottle={200}>
        {ALL_SECTIONS.map(renderSection)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  navBar: {
    height: 60,
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
    maxHeight: GRID_MAX_HEIGHT,
  },
  gridContainer: {
    paddingHorizontal: GRID_PADDING,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
    gap: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray400,
    letterSpacing: 0.5,
  },
  randomiseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.gray700,
  },
  randomiseText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
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

export default React.memo(StickerGrid);

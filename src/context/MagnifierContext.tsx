import React, {createContext, useContext, useMemo} from 'react';
import {useSharedValue, type SharedValue} from 'react-native-reanimated';

export interface MagnifierState {
  isDragging: SharedValue<boolean>;
  dragPositionX: SharedValue<number>;
  dragPositionY: SharedValue<number>;
  dragStickerId: SharedValue<string | null>;
}

const MagnifierContext = createContext<MagnifierState | null>(null);

interface MagnifierProviderProps {
  children: React.ReactNode;
}

export const MagnifierProvider: React.FC<MagnifierProviderProps> = ({children}) => {
  const isDragging = useSharedValue(false);
  const dragPositionX = useSharedValue(0);
  const dragPositionY = useSharedValue(0);
  const dragStickerId = useSharedValue<string | null>(null);

  const value = useMemo<MagnifierState>(
    () => ({
      isDragging,
      dragPositionX,
      dragPositionY,
      dragStickerId,
    }),
    [isDragging, dragPositionX, dragPositionY, dragStickerId],
  );

  return (
    <MagnifierContext.Provider value={value}>
      {children}
    </MagnifierContext.Provider>
  );
};

export const useMagnifier = (): MagnifierState => {
  const context = useContext(MagnifierContext);
  if (!context) {
    throw new Error('useMagnifier must be used within MagnifierProvider');
  }
  return context;
};

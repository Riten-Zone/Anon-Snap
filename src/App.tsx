import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet, LogBox} from 'react-native';
import StickerPreloader from './components/StickerPreloader';

LogBox.ignoreLogs(['Sending `onAnimatedValueUpdate` with no listeners registered']);

import {
  HomeScreen,
  CameraScreen,
  EditorScreen,
} from './screens';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <StickerPreloader />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: {backgroundColor: '#000000'},
          }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="Camera"
            component={CameraScreen}
            options={{animation: 'slide_from_right'}}
          />
          <Stack.Screen
            name="Editor"
            component={EditorScreen}
            options={{animation: 'slide_from_bottom'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;

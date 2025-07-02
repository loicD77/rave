import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import des écrans
import HomeScreen from './screens/HomeScreen';
import TransferScreen from './screens/TransferScreen';
import RaveScreen from './screens/RaveScreen';
import RecordScreen from './screens/RecordScreen';

const Tab = createBottomTabNavigator();

// Header personnalisé
function CustomHeader({ title, subtitle }) {
  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e']}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
    </LinearGradient>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Transfer') {
              iconName = focused ? 'flash' : 'flash-outline';
            } else if (route.name === 'RAVE') {
              iconName = focused ? 'radio' : 'radio-outline';
            } else if (route.name === 'Record') {
              iconName = focused ? 'mic' : 'mic-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#7F5AF0',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#1a1a2e',
            borderTopColor: '#7F5AF0',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: 'bold',
          },
          header: ({ route }) => {
            let title = '';
            let subtitle = '';
            
            switch (route.name) {
              case 'Home':
                title = '🌌 RAVE TRANSFER';
                subtitle = 'Neural Audio Transformation';
                break;
              case 'Transfer':
                title = '⚡ Transfert de Timbre';
                subtitle = 'AI Audio Processing';
                break;
              case 'RAVE':
                title = '🎛️ Interface RAVE';
                subtitle = 'Advanced Neural Processing';
                break;
              case 'Record':
                title = '🎤 Enregistrement';
                subtitle = 'Audio Capture Studio';
                break;
            }
            
            return <CustomHeader title={title} subtitle={subtitle} />;
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Accueil' }}
        />
        <Tab.Screen 
          name="Transfer" 
          component={TransferScreen}
          options={{ title: 'Transfert' }}
        />
        <Tab.Screen 
          name="RAVE" 
          component={RaveScreen}
          options={{ title: 'RAVE' }}
        />
        <Tab.Screen 
          name="Record" 
          component={RecordScreen}
          options={{ title: 'Enregistrement' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 40, // Pour la status bar
    paddingBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#7F5AF0',
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.9,
  },
});
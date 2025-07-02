import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import RecordScreen from '../screens/RecordScreen';
import RaveScreen from '../screens/RaveScreen';
import TransferScreen from '../screens/TransferScreen';



const Tab = createMaterialTopTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: { fontWeight: 'bold', fontSize: 14 },
        tabBarStyle: { backgroundColor: '#f9f9f9', elevation: 4 },
        tabBarIndicatorStyle: { backgroundColor: '#ff000a', height: 4, borderRadius: 2 },
        tabBarShowIcon: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
  name="Transfert"
  component={TransferScreen}
  options={{
    tabBarLabel: 'Transfert',
    tabBarIcon: ({ color }) => (
      <Ionicons name="swap-horizontal" size={22} color={color} />
    ),
  }}
/>

      <Tab.Screen
        name="Record"
        component={RecordScreen}
        options={{
          tabBarLabel: 'Enregistrer',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="microphone" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RAVE"
        component={RaveScreen}
        options={{
          tabBarLabel: 'RAVE',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="music" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
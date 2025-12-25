import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, List, Settings, CheckSquare } from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AdminScreen from '../screens/AdminScreen';
import TodosScreen from '../screens/TodosScreen';

import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
    const { theme } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#4caf50',
                tabBarInactiveTintColor: '#999',
                tabBarStyle: {
                    paddingBottom: 5,
                    height: 60,
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.border,
                }
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color }) => <Home color={color} size={24} />,
                    tabBarLabel: 'Inicio'
                }}
            />
            <Tab.Screen
                name="Transactions"
                component={TransactionsScreen}
                options={{
                    tabBarIcon: ({ color }) => <List color={color} size={24} />,
                    tabBarLabel: 'Movimientos'
                }}
            />
            <Tab.Screen
                name="Todos"
                component={TodosScreen}
                options={{
                    tabBarIcon: ({ color }) => <CheckSquare color={color} size={24} />,
                    tabBarLabel: 'Tareas'
                }}
            />
            <Tab.Screen
                name="Admin"
                component={AdminScreen}
                options={{
                    tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
                    tabBarLabel: 'Admin'
                }}
            />
        </Tab.Navigator>
    );
}

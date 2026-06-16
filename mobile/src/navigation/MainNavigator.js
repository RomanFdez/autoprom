import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, List, Settings, TrendingUp, BarChart2, Wallet, ShieldCheck } from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AdminScreen from '../screens/AdminScreen';
import AvanceScreen from '../screens/AvanceScreen';
import FinanzasScreen from '../screens/FinanzasScreen';
import SegurosScreen from '../screens/SegurosScreen';

import { useTheme } from '../context/ThemeContext';
import { FinanzasProvider } from '../context/FinanzasContext';
import { SegurosProvider } from '../context/SegurosContext';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
    const { theme } = useTheme();

    return (
        <FinanzasProvider>
        <SegurosProvider>
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
                name="Seguros"
                component={SegurosScreen}
                options={{
                    tabBarIcon: ({ color }) => <ShieldCheck color={color} size={24} />,
                    tabBarLabel: 'Seguros'
                }}
            />
            <Tab.Screen
                name="Statistics"
                component={StatisticsScreen}
                options={{
                    tabBarIcon: ({ color }) => <BarChart2 color={color} size={24} />,
                    tabBarLabel: 'Estadísticas'
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
                name="Avance"
                component={AvanceScreen}
                options={{
                    tabBarIcon: ({ color }) => <TrendingUp color={color} size={24} />,
                    tabBarLabel: 'Avance'
                }}
            />
            <Tab.Screen
                name="Finanzas"
                component={FinanzasScreen}
                options={{
                    tabBarIcon: ({ color }) => <Wallet color={color} size={24} />,
                    tabBarLabel: 'Finanzas'
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
        </SegurosProvider>
        </FinanzasProvider>
    );
}

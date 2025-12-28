import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { User, Lock } from 'lucide-react-native';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const { login, loginWithGoogleCredential } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // IMPORTANT: Replace with your actual Web Client ID from Firebase Console -> Authentication -> Sign-in method -> Google -> Web SDK configuration
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: '1025233072686-7gqns30ji4jo1c7sr1c3jktmhs6etsdk.apps.googleusercontent.com',
        redirectUri: makeRedirectUri({ scheme: 'autoprom' }),
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleLogin(id_token);
        }
    }, [response]);

    const handleGoogleLogin = async (token) => {
        setLoading(true);
        const success = await loginWithGoogleCredential(token);
        setLoading(false);
        if (!success) {
            Alert.alert('Error', 'Error al iniciar sesión con Google');
        }
    };

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
            return;
        }

        setLoading(true);
        const success = await login(username, password);
        setLoading(false);

        if (!success) {
            Alert.alert('Error', 'Credenciales incorrectas');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.title}>Bienvenido</Text>
                    <Text style={styles.subtitle}>Gestiona tus finanzas</Text>
                </View>

                <View style={styles.form}>
                    <TouchableOpacity
                        style={[styles.googleButton, !request && styles.buttonDisabled]}
                        onPress={() => promptAsync()}
                        disabled={!request || loading}
                    >
                        <Image
                            source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                            style={{ width: 24, height: 24, marginRight: 12 }}
                        />
                        <Text style={styles.googleButtonText}>Continuar con Google</Text>
                    </TouchableOpacity>

                    <View style={styles.separatorContainer}>
                        <View style={styles.separatorLine} />
                        <Text style={styles.separatorText}>O</Text>
                        <View style={styles.separatorLine} />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Correo electrónico</Text>
                        <View style={styles.inputWrapper}>
                            <User size={20} color="#666" style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.input}
                                placeholder="ejemplo@correo.com"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Contraseña</Text>
                        <View style={styles.inputWrapper}>
                            <Lock size={20} color="#666" style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.input}
                                placeholder="Contraseña"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    form: {
        gap: 20,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
    },
    input: {
        flex: 1,
        height: 50,
    },
    button: {
        backgroundColor: '#4caf50',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    googleButton: {
        flexDirection: 'row',
        backgroundColor: 'white',
        height: 50,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 10,
    },
    googleButtonText: {
        color: '#757575',
        fontWeight: '600',
        fontSize: 16,
    },
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#eee',
    },
    separatorText: {
        marginHorizontal: 10,
        color: '#999',
        fontSize: 14,
    },
    footer: {
        marginTop: 24,
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
    }
});

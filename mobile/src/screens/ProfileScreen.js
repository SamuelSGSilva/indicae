import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name || '?')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.id}>Talent ID: {user?.id}</Text>
      </View>

      <View style={styles.scoreBox}>
        <Text style={styles.scoreTitle}>Global Trust Score</Text>
        <Text style={styles.scoreNumber}>5</Text>
      </View>

      <Button title="Desconectar" color="#ef4444" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#a855f7',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  id: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 4,
  },
  scoreBox: {
    backgroundColor: 'rgba(5, 8, 22, 0.85)',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  scoreTitle: {
    color: '#10b981',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
  }
});

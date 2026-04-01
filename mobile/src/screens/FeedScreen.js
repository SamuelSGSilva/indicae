import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

export default function FeedScreen() {
  const { user } = useContext(AuthContext);
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      // Puxar a rede b2b para exibicao de talentos mock ou os hardcoded skills
      const response = await api.get('/api/b2b/search?skill=python');
      setTalents(response.data.talents || []);
    } catch (e) {
      console.log('Error fetching feed', e);
      setTalents([
        { id: 101, nome: "Usuário Exemplo", bio: "O backend está inicializando...", confianca: 10 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleEndorse = async (targetId) => {
    try {
      await api.post('/api/network/validate', {
        validator_id: user.id,
        target_user_id: targetId,
        skill_name: "Mobile Dev",
        weight: 5
      });
      Alert.alert('Sucesso!', 'Você enviou um Endosso Neural para este talento.');
    } catch (e) {
      Alert.alert('Ops', 'Houve um erro na comunicação com o Neo4j local.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.nome}</Text>
      <Text style={styles.bio} numberOfLines={2}>{item.bio || 'Criador de Software'}</Text>
      <View style={styles.footer}>
        <Text style={styles.score}>Trust Score: {item.confianca}</Text>
        <TouchableOpacity style={styles.endorseButton} onPress={() => handleEndorse(item.id)}>
          <Text style={styles.endorseText}>+ UPVOTE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color="#7c3aed" size="large" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={talents}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{color: '#fff', textAlign: 'center'}}>Nenhum talento na rede.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
    padding: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06b6d4',
    marginBottom: 6,
  },
  bio: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  score: {
    color: '#10b981',
    fontWeight: '600',
  },
  endorseButton: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  endorseText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  }
});

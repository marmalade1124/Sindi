import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { fetchOutages, Outage, formatOutageTime, getStatusColor } from '../services/api';

const BASE_URL = 'http://192.168.1.3:8000';

export default function HistoryScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [allOutages, setAllOutages] = useState<Outage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, outagesRes] = await Promise.all([
        fetch(`${BASE_URL}/api/stats`).then(r => r.json()),
        fetchOutages(undefined, 50),
      ]);
      setStats(statsRes);
      setAllOutages(outagesRes);
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const StatCard = ({ icon, label, value, color, bg }: any) => (
    <View style={[st.statCard, { backgroundColor: bg, borderColor: colors.borderLight }]}>
      <MaterialIcons name={icon} size={22} color={color} />
      <Text style={[st.statValue, { color }]}>{value}</Text>
      <Text style={[st.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBarStyle} />

      <View style={[st.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <View style={{ width: 38 }} />
        <Text style={[st.headerTitle, { color: colors.text }]}>Outage History</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {/* Stats Grid */}
          <Text style={[st.sectionLabel, { color: colors.textMuted }]}>OVERVIEW</Text>
          <View style={st.statsGrid}>
            <StatCard icon="bolt" label="Total" value={stats?.total || 0} color={colors.accent} bg={isDark ? '#422006' : '#fefce8'} />
            <StatCard icon="error" label="Active" value={stats?.active || 0} color={colors.dangerText} bg={colors.dangerBg} />
            <StatCard icon="schedule" label="Upcoming" value={stats?.upcoming || 0} color={colors.warningText} bg={colors.warningBg} />
            <StatCard icon="check-circle" label="Resolved" value={stats?.resolved || 0} color={colors.successText} bg={colors.successBg} />
          </View>

          {/* Most Affected Cities */}
          {stats?.most_affected_cities?.length > 0 && (
            <>
              <Text style={[st.sectionLabel, { color: colors.textMuted, marginTop: 24 }]}>MOST AFFECTED CITIES</Text>
              <View style={[st.cityCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                {stats.most_affected_cities.map((item: any, i: number) => (
                  <View key={item.city} style={[st.cityRow, i < stats.most_affected_cities.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
                    <View style={st.cityRank}>
                      <Text style={[st.rankNum, { color: i === 0 ? colors.accent : colors.textMuted }]}>{i + 1}</Text>
                    </View>
                    <Text style={[st.cityName, { color: colors.text }]}>{item.city}</Text>
                    <View style={[st.countBadge, { backgroundColor: colors.surfaceAlt }]}>
                      <Text style={[st.countText, { color: colors.textSecondary }]}>{item.count} outage{item.count > 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Outage Type Breakdown */}
          {stats?.outage_types && Object.keys(stats.outage_types).length > 0 && (
            <>
              <Text style={[st.sectionLabel, { color: colors.textMuted, marginTop: 24 }]}>OUTAGE TYPES</Text>
              <View style={st.typeRow}>
                {Object.entries(stats.outage_types).map(([type, count]: any) => {
                  const typeColor = type === 'emergency' ? colors.dangerText : type === 'planned' ? colors.warningText : colors.textSecondary;
                  const typeBg = type === 'emergency' ? colors.dangerBg : type === 'planned' ? colors.warningBg : colors.surfaceAlt;
                  const typeIcon = type === 'emergency' ? 'warning' : type === 'planned' ? 'event' : 'info';
                  return (
                    <View key={type} style={[st.typeCard, { backgroundColor: typeBg, borderColor: colors.borderLight }]}>
                      <MaterialIcons name={typeIcon as any} size={22} color={typeColor} />
                      <Text style={[st.typeCount, { color: typeColor }]}>{count}</Text>
                      <Text style={[st.typeLabel, { color: colors.textMuted }]}>{type}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Recent History */}
          <Text style={[st.sectionLabel, { color: colors.textMuted, marginTop: 24 }]}>ALL OUTAGES</Text>
          {allOutages.map(outage => {
            const statusStyle = getStatusColor(outage.status);
            const statusColor = outage.status === 'active' ? colors.dangerText : outage.status === 'upcoming' ? colors.warningText : colors.successText;
            const statusBg = outage.status === 'active' ? colors.dangerBg : outage.status === 'upcoming' ? colors.warningBg : colors.successBg;
            return (
              <View key={outage.id} style={[st.historyItem, { backgroundColor: colors.cardBg, borderColor: colors.borderLight }]}>
                <View style={st.historyHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.historyTitle, { color: colors.text }]} numberOfLines={1}>{outage.reason || 'Power Interruption'}</Text>
                    <Text style={[st.historyMeta, { color: colors.textMuted }]}>
                      {formatOutageTime(outage.start_datetime)} • {outage.outage_type}
                    </Text>
                  </View>
                  <View style={[st.historyBadge, { backgroundColor: statusBg }]}>
                    <Text style={[st.historyBadgeText, { color: statusColor }]}>{statusStyle.label}</Text>
                  </View>
                </View>
                {outage.affected_areas.length > 0 && (
                  <View style={st.historyAreas}>
                    <MaterialIcons name="location-on" size={12} color={colors.textMuted} />
                    <Text style={[st.historyAreaText, { color: colors.textMuted }]} numberOfLines={1}>
                      {outage.affected_areas.map(a => a.city).filter((v, i, arr) => arr.indexOf(v) === i).join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10, marginLeft: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1 },
  statValue: { fontSize: 28, fontWeight: '900', marginTop: 6 },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  cityCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  cityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  cityRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  rankNum: { fontSize: 12, fontWeight: '800' },
  cityName: { flex: 1, fontSize: 14, fontWeight: '600' },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  countText: { fontSize: 11, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeCard: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1 },
  typeCount: { fontSize: 22, fontWeight: '900', marginTop: 4 },
  typeLabel: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize', marginTop: 2 },
  historyItem: { borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1 },
  historyHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  historyTitle: { fontSize: 13, fontWeight: '600' },
  historyMeta: { fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  historyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8 },
  historyBadgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  historyAreas: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  historyAreaText: { fontSize: 11, marginLeft: 4 },
});

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { fetchOutages, Outage, formatOutageTime, getStatusColor } from '../services/api';

export default function MapScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const [outages, setOutages] = useState<Outage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchOutages(undefined, 30);
      setOutages(data);
    } catch (err) { console.warn("Failed to load outages:", err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const cityGroups: Record<string, { outages: Outage[]; areas: Set<string> }> = {};
  outages.forEach(o => {
    o.affected_areas.forEach(area => {
      if (!cityGroups[area.city]) cityGroups[area.city] = { outages: [], areas: new Set() };
      if (!cityGroups[area.city].outages.find(ex => ex.id === o.id)) cityGroups[area.city].outages.push(o);
      cityGroups[area.city].areas.add(area.barangay);
    });
  });
  const sortedCities = Object.keys(cityGroups).sort();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBarStyle} />
      <View style={[s.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <View style={{ width: 38 }} />
        <Text style={[s.headerTitle, { color: colors.text }]}>Affected Areas</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.accent} /></View>
      ) : sortedCities.length === 0 ? (
        <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
          <View style={[s.center, { paddingTop: 80 }]}>
            <View style={[s.emptyIcon, { backgroundColor: colors.surfaceAlt }]}>
              <MaterialIcons name="map" size={48} color={colors.textMuted} />
            </View>
            <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>No Affected Areas</Text>
            <Text style={[s.emptySub, { color: colors.textMuted }]}>When outages are detected, affected cities will appear here.</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
          <Text style={[s.countLabel, { color: colors.textMuted }]}>{sortedCities.length} {sortedCities.length === 1 ? 'CITY' : 'CITIES'} AFFECTED</Text>
          {sortedCities.map(city => {
            const group = cityGroups[city];
            const activeCount = group.outages.filter(o => o.status === 'active').length;
            const upcomingCount = group.outages.filter(o => o.status === 'upcoming').length;
            return (
              <View key={city} style={[s.cityCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={[s.cityHeader, { borderBottomColor: colors.borderLight }]}>
                  <View style={[s.cityIcon, { backgroundColor: isDark ? '#1e3a5e' : '#eff6ff' }]}>
                    <MaterialIcons name="location-city" size={20} color={isDark ? '#93c5fd' : '#1e3a8a'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cityName, { color: colors.text }]}>{city}</Text>
                    <Text style={[s.cityMeta, { color: colors.textMuted }]}>{group.areas.size} barangays • {group.outages.length} outage{group.outages.length > 1 ? 's' : ''}</Text>
                  </View>
                  <View style={s.cityBadges}>
                    {activeCount > 0 && <View style={[s.badge, { backgroundColor: colors.dangerBg }]}><Text style={[s.badgeText, { color: colors.dangerText }]}>{activeCount} Active</Text></View>}
                    {upcomingCount > 0 && <View style={[s.badge, { backgroundColor: colors.warningBg }]}><Text style={[s.badgeText, { color: colors.warningText }]}>{upcomingCount} Upcoming</Text></View>}
                  </View>
                </View>
                <View style={[s.areaWrap, { borderBottomColor: colors.borderLight }]}>
                  {Array.from(group.areas).sort().map(area => (
                    <View key={area} style={[s.areaPill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                      <MaterialIcons name="place" size={10} color={colors.textMuted} />
                      <Text style={[s.areaText, { color: colors.textSecondary }]}>{area}</Text>
                    </View>
                  ))}
                </View>
                {group.outages.map(outage => {
                  const statusStyle = getStatusColor(outage.status);
                  const badgeBg = outage.status === 'active' ? colors.dangerBg : outage.status === 'upcoming' ? colors.warningBg : colors.successBg;
                  const badgeColor = outage.status === 'active' ? colors.dangerText : outage.status === 'upcoming' ? colors.warningText : colors.successText;
                  return (
                    <TouchableOpacity key={outage.id} style={[s.outageRow, { borderBottomColor: colors.borderLight }]} onPress={() => navigation.navigate('OutageDetails', { outageId: outage.id })} activeOpacity={0.7}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.outageReason, { color: colors.textSecondary }]} numberOfLines={1}>{outage.reason || 'Power Interruption'}</Text>
                        <Text style={[s.outageTime, { color: colors.textMuted }]}>{formatOutageTime(outage.start_datetime)}</Text>
                      </View>
                      <View style={[s.outageStatusBadge, { backgroundColor: badgeBg }]}><Text style={[s.outageStatusText, { color: badgeColor }]}>{statusStyle.label}</Text></View>
                      <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { padding: 16, borderRadius: 32, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  countLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },
  cityCard: { borderRadius: 16, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  cityHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  cityIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cityName: { fontSize: 15, fontWeight: '700' },
  cityMeta: { fontSize: 11, marginTop: 1 },
  cityBadges: { flexDirection: 'row' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 4 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  areaWrap: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, paddingBottom: 4, borderBottomWidth: 1 },
  areaPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, marginRight: 5, marginBottom: 5 },
  areaText: { fontSize: 10, marginLeft: 3 },
  outageRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1 },
  outageReason: { fontSize: 13, fontWeight: '600' },
  outageTime: { fontSize: 11, marginTop: 2 },
  outageStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 6 },
  outageStatusText: { fontSize: 9, fontWeight: '800' },
});

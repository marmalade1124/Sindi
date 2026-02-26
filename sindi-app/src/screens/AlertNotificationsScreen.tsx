import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { fetchOutages, Outage, formatOutageTime, getStatusColor } from '../services/api';

export default function AlertNotificationsScreen() {
  const { colors } = useTheme();
  const [outages, setOutages] = useState<Outage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await fetchOutages(undefined, 30);
      setOutages(data);
    } catch (err) { console.warn("Failed to load alerts:", err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadAlerts(); }, [loadAlerts]));
  const onRefresh = () => { setRefreshing(true); loadAlerts(); };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBarStyle} />
      <View style={[s.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <View style={{ width: 38 }} />
        <Text style={[s.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.accent} /></View>
      ) : outages.length === 0 ? (
        <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
          <View style={[s.center, { paddingTop: 80 }]}>
            <View style={[s.emptyIcon, { backgroundColor: colors.surfaceAlt }]}>
              <MaterialIcons name="notifications-off" size={48} color={colors.textMuted} />
            </View>
            <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>No Notifications</Text>
            <Text style={[s.emptySub, { color: colors.textMuted }]}>Outage alerts will appear here when they're detected.</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
          <Text style={[s.sectionLabel, { color: colors.textMuted }]}>{outages.length} ALERT{outages.length > 1 ? 'S' : ''}</Text>
          {outages.map((outage, i) => {
            const statusStyle = getStatusColor(outage.status);
            const isActive = outage.status === 'active';
            const isUpcoming = outage.status === 'upcoming';
            const iconName = isActive ? 'warning' : isUpcoming ? 'schedule' : 'check-circle';
            const iconColor = isActive ? colors.dangerText : isUpcoming ? colors.warningText : colors.successText;
            const borderLeftColor = isActive ? colors.dangerText : isUpcoming ? colors.warningText : colors.successText;

            return (
              <View key={outage.id} style={[s.alertCard, { backgroundColor: colors.cardBg, borderColor: colors.borderLight, borderLeftColor, borderLeftWidth: 3 }]}>
                <View style={s.alertHeader}>
                  <MaterialIcons name={iconName as any} size={20} color={iconColor} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[s.alertTitle, { color: colors.text }]} numberOfLines={2}>{outage.reason || 'Power Interruption'}</Text>
                    <Text style={[s.alertMeta, { color: colors.textMuted }]}>
                      {outage.outage_type} • {formatOutageTime(outage.start_datetime)}
                    </Text>
                  </View>
                  <View style={[s.alertBadge, { backgroundColor: isActive ? colors.dangerBg : isUpcoming ? colors.warningBg : colors.successBg }]}>
                    <Text style={[s.alertBadgeText, { color: iconColor }]}>{statusStyle.label}</Text>
                  </View>
                </View>
                {outage.affected_areas.length > 0 && (
                  <View style={[s.alertAreas, { borderTopColor: colors.borderLight }]}>
                    <MaterialIcons name="location-on" size={12} color={colors.textMuted} />
                    <Text style={[s.alertAreaText, { color: colors.textMuted }]} numberOfLines={1}>
                      {outage.affected_areas.map(a => a.barangay).join(', ')}
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

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { padding: 16, borderRadius: 32, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },
  alertCard: { borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  alertHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
  alertTitle: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  alertMeta: { fontSize: 11, marginTop: 3, textTransform: 'capitalize' },
  alertBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  alertBadgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  alertAreas: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  alertAreaText: { fontSize: 11, marginLeft: 4, flex: 1 },
});

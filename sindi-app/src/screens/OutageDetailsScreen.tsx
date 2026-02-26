import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';
import { fetchOutageById, Outage, formatOutageTime, getStatusColor } from '../services/api';

export default function OutageDetailsScreen({ route, navigation }: any) {
  const { colors, isDark } = useTheme();
  const { outageId } = route.params;
  const [outage, setOutage] = useState<Outage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOutageById(outageId).then(setOutage).catch(console.warn).finally(() => setLoading(false));
  }, [outageId]);

  if (loading) {
    return <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}><View style={s.center}><ActivityIndicator size="large" color={colors.accent} /></View></SafeAreaView>;
  }

  if (!outage) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        <View style={s.center}>
          <Text style={{ color: colors.textMuted }}>Outage not found.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: colors.accent, marginTop: 10, fontWeight: '600' }}>Go Back</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = getStatusColor(outage.status);
  const statusColor = outage.status === 'active' ? colors.dangerText : outage.status === 'upcoming' ? colors.warningText : colors.successText;
  const statusBg = outage.status === 'active' ? colors.dangerBg : outage.status === 'upcoming' ? colors.warningBg : colors.successBg;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBarStyle} />

      <View style={[s.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Outage Details</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Status + Type */}
        <View style={s.topRow}>
          <View style={[s.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[s.statusText, { color: statusColor }]}>{statusStyle.label}</Text>
          </View>
          <Text style={[s.typeLabel, { color: colors.textMuted }]}>{outage.outage_type} outage</Text>
        </View>

        {/* Reason */}
        <Text style={[s.reason, { color: colors.text }]}>{outage.reason || 'Power Interruption'}</Text>

        {/* Info Cards */}
        <View style={[s.infoCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <InfoRow icon="schedule" label="Start" value={formatOutageTime(outage.start_datetime)} colors={colors} />
          {outage.estimated_restore_datetime && (
            <InfoRow icon="event-available" label="Est. Restore" value={formatOutageTime(outage.estimated_restore_datetime)} colors={colors} />
          )}
          <InfoRow icon="business" label="Source" value="NORDECO" colors={colors} last />
        </View>

        {/* Affected Areas */}
        {outage.affected_areas.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Affected Areas</Text>
            <View style={[s.infoCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              {outage.affected_areas.map((area, i) => (
                <View key={area.id} style={[s.areaRow, i < outage.affected_areas.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
                  <MaterialIcons name="place" size={16} color={colors.textMuted} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={[s.areaBarangay, { color: colors.text }]}>{area.barangay}</Text>
                    <Text style={[s.areaCity, { color: colors.textMuted }]}>{area.city}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Original Post */}
        {outage.post_text && (
          <>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Original Post</Text>
            <View style={[s.postCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={[s.postText, { color: colors.textSecondary }]}>{outage.post_text}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, colors, last = false }: any) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 }, !last && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
      <MaterialIcons name={icon} size={18} color={colors.textMuted} />
      <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 10, width: 80 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, flex: 1 }}>{value || '—'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  typeLabel: { fontSize: 12, textTransform: 'capitalize' },
  reason: { fontSize: 20, fontWeight: '800', lineHeight: 28, marginBottom: 20 },
  infoCard: { borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  areaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14 },
  areaBarangay: { fontSize: 13, fontWeight: '600' },
  areaCity: { fontSize: 11, marginTop: 1 },
  postCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  postText: { fontSize: 13, lineHeight: 20 },
});

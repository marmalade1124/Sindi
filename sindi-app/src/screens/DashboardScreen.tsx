import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl, StyleSheet, TextInput, Platform, StatusBar as RNStatusBar, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { fetchActiveOutages, fetchOutages, searchOutages, Outage, formatOutageTime, getStatusColor, getOutageTypeIcon } from '../services/api';

function OutageCard({ outage, onPress, colors, index = 0 }: { outage: Outage; onPress: () => void; colors: any; index?: number }) {
  const statusStyle = getStatusColor(outage.status);
  const icon = getOutageTypeIcon(outage.outage_type);
  const iconColor = outage.status === 'active' ? colors.dangerText : outage.status === 'upcoming' ? colors.warningText : colors.successText;
  const iconBg = outage.status === 'active' ? colors.dangerBg : outage.status === 'upcoming' ? colors.warningBg : colors.successBg;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 100, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity 
        style={[st.card, { backgroundColor: isDarkStr(colors.background) ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)', borderColor: colors.borderLight }]} 
        onPress={onPress} 
        activeOpacity={0.7}
      >
        <LinearGradient
           colors={[isDarkStr(colors.background) ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)', 'transparent']}
           style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
           start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <View style={[st.badge, { backgroundColor: iconBg }]}>
          <Text style={[st.badgeText, { color: iconColor }]}>{statusStyle.label}</Text>
        </View>
        <View style={st.cardRow}>
          <View style={[st.iconCircle, { backgroundColor: iconBg }]}>
            <MaterialIcons name={icon as any} size={18} color={iconColor} />
          </View>
          <View style={st.cardBody}>
            <Text style={[st.cardTitle, { color: colors.text }]} numberOfLines={2}>{outage.reason || 'Power Interruption'}</Text>
            <Text style={[st.cardType, { color: colors.textMuted }]}>{outage.outage_type} Outage</Text>
            <View style={st.cardMeta}>
              <MaterialIcons name="schedule" size={12} color={colors.textMuted} />
              <Text style={[st.metaText, { color: colors.textMuted }]}>{formatOutageTime(outage.start_datetime)}</Text>
              {outage.affected_areas.length > 0 && (
                <>
                  <MaterialIcons name="location-on" size={12} color={colors.textMuted} style={{ marginLeft: 10 }} />
                  <Text style={[st.metaText, { color: colors.textMuted }]}>{outage.affected_areas[0].city}</Text>
                </>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// helper to detect dark themes to adjust glass opacity
const isDarkStr = (c: string) => c === '#0F172A' || c.toLowerCase() === '#121212';

export default function DashboardScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const [activeOutages, setActiveOutages] = useState<Outage[]>([]);
  const [upcomingOutages, setUpcomingOutages] = useState<Outage[]>([]);
  const [recentOutages, setRecentOutages] = useState<Outage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Outage[]>([]);
  const [searching, setSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const searchTimer = useRef<any>(null);

  const loadData = useCallback(async () => {
    try {
      const [active, upcoming, recent] = await Promise.all([
        fetchActiveOutages(),
        fetchOutages("upcoming", 10),
        fetchOutages(undefined, 20),
      ]);
      setActiveOutages(active);
      setUpcomingOutages(upcoming);
      setRecentOutages(recent);
    } catch (err) {
      console.warn("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.length < 2) { setIsSearchMode(false); setSearchResults([]); return; }
    setIsSearchMode(true);
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const results = await searchOutages(text);
      setSearchResults(results);
      setSearching(false);
    }, 400);
  };

  const clearSearch = () => { setSearchQuery(''); setIsSearchMode(false); setSearchResults([]); };
  const hasActiveOutages = activeOutages.length > 0;

  return (
    <LinearGradient
      colors={isDark ? ['#0F172A', '#1E293B'] : ['#F8FAFC', '#E2E8F0']}
      style={st.safe}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style={colors.statusBarStyle} />

        <View style={st.header}>
          <View style={st.logoRow}>
            <MaterialIcons name="bolt" size={24} color="#FFD600" />
            <Text style={[st.logoText, { color: colors.text }]}>Sindí</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={[st.searchWrap, { borderBottomColor: colors.border }]}>
        <View style={[st.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[st.searchInput, { color: colors.text }]}
            placeholder="Search city, barangay, or keyword..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <MaterialIcons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 10 }}>Loading outages...</Text>
        </View>
      ) : isSearchMode ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <Text style={[st.sectionLabel, { color: colors.textMuted }]}>
            {searching ? 'SEARCHING...' : `${searchResults.length} RESULT${searchResults.length !== 1 ? 'S' : ''}`}
          </Text>
          {searching ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 20 }} />
          ) : searchResults.length === 0 ? (
            <View style={[st.emptyBoxSmall, { backgroundColor: colors.cardBg, borderColor: colors.borderLight }]}>
              <MaterialIcons name="search-off" size={32} color={colors.textMuted} />
              <Text style={[st.emptySmallTitle, { color: colors.textSecondary }]}>No Results</Text>
              <Text style={[st.emptySmallSub, { color: colors.textMuted }]}>Try a different city, barangay, or keyword.</Text>
            </View>
          ) : (
            searchResults.map((o, i) => <OutageCard key={o.id} outage={o} colors={colors} index={i} onPress={() => navigation.navigate('OutageDetails', { outageId: o.id })} />)
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          <View style={st.sectionHeaderRow}>
            <Text style={[st.sectionLabel, { color: colors.textMuted }]}>LIVE STATUS</Text>
            <View style={[st.liveChip, { backgroundColor: hasActiveOutages ? colors.dangerBg : colors.successBg, borderColor: hasActiveOutages ? colors.dangerText + '33' : colors.successText + '33' }]}>
              <View style={[st.liveDot, { backgroundColor: hasActiveOutages ? colors.dangerText : colors.successText }]} />
              <Text style={[st.liveLabel, { color: hasActiveOutages ? colors.dangerText : colors.successText }]}>
                {hasActiveOutages ? `${activeOutages.length} ACTIVE` : 'ALL CLEAR'}
              </Text>
            </View>
          </View>

          {hasActiveOutages ? (
            activeOutages.map((o, i) => <OutageCard key={o.id} outage={o} colors={colors} index={i} onPress={() => navigation.navigate('OutageDetails', { outageId: o.id })} />)
          ) : (
            <View
              style={[st.emptyBox, { backgroundColor: isDarkStr(colors.background) ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)', borderColor: colors.borderLight }]}
            >
              <View style={{ backgroundColor: colors.successBg, padding: 16, borderRadius: 32, marginBottom: 16 }}>
                <MaterialIcons name="check-circle" size={48} color={colors.successText} />
              </View>
              <Text style={[st.emptyTitle, { color: colors.text }]}>No Active Outages</Text>
              <Text style={[st.emptySub, { color: colors.textMuted }]}>No power interruptions are currently affecting your area. Everything is looking good!</Text>
            </View>
          )}

          <Text style={[st.sectionTitle, { color: colors.text }]}>Upcoming Scheduled</Text>
          {upcomingOutages.length > 0 ? (
            upcomingOutages.map((o, i) => <OutageCard key={o.id} outage={o} colors={colors} index={i} onPress={() => navigation.navigate('OutageDetails', { outageId: o.id })} />)
          ) : (
            <View style={[st.emptyBoxSmall, { backgroundColor: isDarkStr(colors.background) ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)', borderColor: colors.borderLight }]}>
              <MaterialIcons name="event" size={28} color={colors.textMuted} />
              <Text style={[st.emptySmallTitle, { color: colors.textSecondary }]}>No Scheduled Outages</Text>
            </View>
          )}

          <Text style={[st.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          {recentOutages.length > 0 ? (
            recentOutages.slice(0, 5).map((o, i) => <OutageCard key={o.id} outage={o} colors={colors} index={i} onPress={() => navigation.navigate('OutageDetails', { outageId: o.id })} />)
          ) : (
            <View style={[st.emptyBoxSmall, { backgroundColor: isDarkStr(colors.background) ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)', borderColor: colors.borderLight }]}>
              <MaterialIcons name="campaign" size={28} color={colors.textMuted} />
              <Text style={[st.emptySmallTitle, { color: colors.textSecondary }]}>No Announcements</Text>
            </View>
          )}
        </ScrollView>
      )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  headerBtn: { padding: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 20, fontWeight: '800', marginLeft: 4 },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#F5F5F7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 42, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, marginLeft: 8, paddingVertical: 0 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 12 },
  liveChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  liveLabel: { fontSize: 10, fontWeight: '800' },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2, overflow: 'hidden' },
  badge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, zIndex: 10 },
  badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', paddingRight: 70 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 2 },
  cardType: { fontSize: 11, textTransform: 'capitalize', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 11, marginLeft: 3 },
  emptyBox: { borderRadius: 18, padding: 28, alignItems: 'center', borderWidth: 1, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  emptyBoxSmall: { borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 1, marginBottom: 4 },
  emptySmallTitle: { fontSize: 14, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  emptySmallSub: { fontSize: 12, textAlign: 'center' },
});

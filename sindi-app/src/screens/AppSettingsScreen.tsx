import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Switch, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const STORAGE_KEY = '@sindi_user_location';

export default function AppSettingsScreen({ navigation }: any) {
  const { colors, isDark, toggleTheme } = useTheme();
  const [savedCity, setSavedCity] = useState<string | null>(null);
  const [savedBarangay, setSavedBarangay] = useState<string | null>(null);

  useEffect(() => {
    loadSavedLocation();
    const unsubscribe = navigation.addListener('focus', loadSavedLocation);
    return unsubscribe;
  }, [navigation]);

  const loadSavedLocation = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedCity(parsed.city || null);
        setSavedBarangay(parsed.barangay || null);
      }
    } catch {}
  };

  const locationLabel = savedCity
    ? `${savedBarangay ? savedBarangay + ', ' : ''}${savedCity}`
    : 'Not set';

  const SettingRow = ({ icon, title, subtitle, onPress, rightElement }: any) => (
    <TouchableOpacity
      style={[s.settingRow]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={[s.settingIcon, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <MaterialIcons name={icon} size={20} color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[s.settingSub, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBarStyle} />

      <View style={[s.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <View style={{ width: 38 }} />
        <Text style={[s.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        <View style={[s.profileCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={[s.profileAvatar, { backgroundColor: colors.accent }]}>
            <MaterialIcons name="person" size={28} color="#0F172A" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[s.profileName, { color: colors.text }]}>Guest User</Text>
            <Text style={[s.profileSub, { color: colors.textMuted }]}>
              {savedCity ? `📍 ${locationLabel}` : 'Set up your location'}
            </Text>
          </View>
        </View>

        <Text style={[s.sectionLabel, { color: colors.textMuted }]}>GENERAL</Text>
        <View style={[s.settingGroup, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <SettingRow icon="location-on" title="My Location" subtitle={locationLabel} onPress={() => navigation.navigate('Location', { fromSettings: true })} />
          <View style={[s.divider, { backgroundColor: colors.borderLight }]} />
          <SettingRow icon="notifications" title="Notification Preferences" subtitle="Manage alert types" onPress={() => Alert.alert('Coming Soon', 'Notification preferences will be available soon.')} />
          <View style={[s.divider, { backgroundColor: colors.borderLight }]} />
          <SettingRow
            icon="dark-mode"
            title="Dark Mode"
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#ffffff"
              />
            }
          />
        </View>

        <Text style={[s.sectionLabel, { color: colors.textMuted }]}>ABOUT SINDÍ</Text>
        <View style={[s.settingGroup, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <SettingRow icon="info" title="About the App" onPress={() => Alert.alert('Sindí v1.0', 'AI-powered outage monitoring for Philippine electric cooperatives.\n\nBuilt with ❤️')} />
          <View style={[s.divider, { backgroundColor: colors.borderLight }]} />
          <SettingRow icon="security" title="Privacy Policy" onPress={() => {}} />
          <View style={[s.divider, { backgroundColor: colors.borderLight }]} />
          <SettingRow icon="gavel" title="Terms of Service" onPress={() => {}} />
        </View>

        <View style={[s.disclaimer, { backgroundColor: isDark ? '#422006' : '#fff7ed', borderColor: isDark ? '#92400e' : '#fed7aa' }]}>
          <MaterialIcons name="warning" size={18} color="#f97316" />
          <Text style={[s.disclaimerText, { color: isDark ? '#fde68a' : '#9a3412' }]}>
            <Text style={{ fontWeight: '700' }}>Disclaimer: </Text>
            Sindí is an independent monitoring app and is not affiliated with any electric cooperative.
          </Text>
        </View>

        <Text style={[s.version, { color: colors.textMuted }]}>Version 1.0.0</Text>

        <TouchableOpacity
          style={[s.signOutBtn, { backgroundColor: isDark ? '#450a0a' : '#fef2f2', borderColor: isDark ? '#7f1d1d' : '#fecaca' }]}
          onPress={() => {
            Alert.alert('Sign Out', 'This will clear your saved location.', [
              { text: 'Cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: async () => {
                await AsyncStorage.multiRemove([STORAGE_KEY, '@sindi_device_id', '@sindi_push_token']);
                navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
              }}
            ]);
          }}
        >
          <Text style={[s.signOutText, { color: isDark ? '#fca5a5' : '#dc2626' }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 16, fontWeight: '700' },
  profileSub: { fontSize: 12, marginTop: 2 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8, marginLeft: 4 },
  settingGroup: { borderRadius: 14, borderWidth: 1, marginBottom: 24, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1 },
  settingTitle: { fontSize: 14, fontWeight: '600' },
  settingSub: { fontSize: 11, marginTop: 1 },
  divider: { height: 1, marginHorizontal: 14 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16, marginLeft: 10 },
  version: { textAlign: 'center', fontSize: 11, marginBottom: 20 },
  signOutBtn: { alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  signOutText: { fontSize: 14, fontWeight: '600' },
});

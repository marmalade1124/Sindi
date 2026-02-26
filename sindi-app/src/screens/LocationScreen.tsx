import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Switch, StyleSheet, ActivityIndicator, Alert, Modal, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchLocations, registerUser, LocationOption } from '../services/api';

const STORAGE_KEY = '@sindi_user_location';

export default function LocationScreen({ navigation, route }: any) {
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);
  const [isEmergencyOnly, setIsEmergencyOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showBarangayPicker, setShowBarangayPicker] = useState(false);

  const isFromSettings = route?.params?.fromSettings === true;
  const availableBarangays = locations.find(l => l.city === selectedCity)?.barangays || [];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load saved location
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedCity(parsed.city || null);
        setSelectedBarangay(parsed.barangay || null);
        setIsEmergencyOnly(parsed.emergency_only || false);
      }
      // Fetch available locations from API
      const locs = await fetchLocations();
      setLocations(locs);
    } catch (err) {
      console.warn('Failed to load location data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCity) {
      Alert.alert('Select City', 'Please select your city to continue.');
      return;
    }

    setSaving(true);
    try {
      // Generate a simple device ID
      let deviceId = await AsyncStorage.getItem('@sindi_device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('@sindi_device_id', deviceId);
      }

      // Save to backend
      await registerUser({
        device_id: deviceId,
        city: selectedCity,
        barangay: selectedBarangay || undefined,
        emergency_only: isEmergencyOnly,
      });

      // Save locally
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        city: selectedCity,
        barangay: selectedBarangay,
        emergency_only: isEmergencyOnly,
      }));

      if (isFromSettings) {
        navigation.goBack();
      } else {
        navigation.navigate('Main');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save location. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderPicker = (
    visible: boolean,
    onClose: () => void,
    title: string,
    data: string[],
    onSelect: (val: string) => void,
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.modalOverlay}>
        <View style={s.modalSheet}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.modalItem} onPress={() => { onSelect(item); onClose(); }}>
                <Text style={s.modalItemText}>{item}</Text>
                {(item === selectedCity || item === selectedBarangay) && (
                  <MaterialIcons name="check-circle" size={20} color="#FFD600" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8', fontSize: 14 }}>No options available</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Set Your Location</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Icon + Intro */}
        <View style={s.intro}>
          <View style={s.introIcon}>
            <MaterialIcons name="location-on" size={28} color="#FFD600" />
          </View>
          <Text style={s.introTitle}>Where do you live?</Text>
          <Text style={s.introSub}>Select your city and barangay to get accurate power outage alerts from your local electric cooperative.</Text>
        </View>

        {/* City Picker */}
        <Text style={s.fieldLabel}>City / Municipality</Text>
        <TouchableOpacity style={s.selectBtn} onPress={() => setShowCityPicker(true)}>
          <Text style={[s.selectText, selectedCity ? s.selectTextActive : null]}>
            {selectedCity || 'Select your city'}
          </Text>
          <MaterialIcons name="expand-more" size={22} color="#64748b" />
        </TouchableOpacity>

        {/* Barangay Picker */}
        <Text style={[s.fieldLabel, { marginTop: 16 }]}>Barangay</Text>
        <TouchableOpacity
          style={[s.selectBtn, !selectedCity && s.selectDisabled]}
          onPress={() => selectedCity && setShowBarangayPicker(true)}
          disabled={!selectedCity}
        >
          <Text style={[s.selectText, selectedBarangay ? s.selectTextActive : null]}>
            {selectedBarangay || (selectedCity ? 'Select your barangay' : 'Select a city first')}
          </Text>
          <MaterialIcons name="expand-more" size={22} color="#64748b" />
        </TouchableOpacity>

        {/* Emergency Only Toggle */}
        <View style={s.toggleRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={s.toggleTitle}>Emergency Alerts Only</Text>
            <Text style={s.toggleSub}>Don't notify me for scheduled maintenance</Text>
          </View>
          <Switch
            trackColor={{ false: '#e2e8f0', true: '#FFD600' }}
            thumbColor="#ffffff"
            onValueChange={setIsEmergencyOnly}
            value={isEmergencyOnly}
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity style={[s.saveBtn, !selectedCity && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#0F172A" />
          ) : (
            <>
              <MaterialIcons name="check-circle" size={20} color="#0F172A" />
              <Text style={s.saveBtnText}>Save Location</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={s.footerNote}>You can change your location anytime in settings.</Text>
      </View>

      {/* Modals */}
      {renderPicker(showCityPicker, () => setShowCityPicker(false), 'Select City', locations.map(l => l.city), (city) => {
        setSelectedCity(city);
        setSelectedBarangay(null);
      })}
      {renderPicker(showBarangayPicker, () => setShowBarangayPicker(false), 'Select Barangay', availableBarangays, setSelectedBarangay)}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  intro: { alignItems: 'center', marginBottom: 28 },
  introIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  introTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  introSub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#0F172A', marginBottom: 8, marginLeft: 4 },
  selectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, height: 52 },
  selectDisabled: { opacity: 0.5 },
  selectText: { fontSize: 15, color: '#94a3b8' },
  selectTextActive: { color: '#0F172A', fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, marginTop: 20 },
  toggleTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  toggleSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  footer: { borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff', padding: 20 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFD600', paddingVertical: 14, borderRadius: 14 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginLeft: 8 },
  footerNote: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 10 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  modalItemText: { fontSize: 15, color: '#1e293b' },
});

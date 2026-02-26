import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Dimensions, FlatList, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'bolt',
    iconBg: '#FFD600',
    title: 'Alam mo kung kailan\nbabalik ang ilaw.',
    subtitle: 'Get real-time alerts for power outages in your area — planned or emergency.',
  },
  {
    icon: 'notifications-active',
    iconBg: '#3b82f6',
    title: 'Never get caught\nin the dark.',
    subtitle: 'Receive push notifications the moment an outage is detected by your electric cooperative.',
  },
  {
    icon: 'map',
    iconBg: '#10b981',
    title: 'Know exactly\nwhich areas are affected.',
    subtitle: 'See affected barangays, estimated restoration times, and outage reasons at a glance.',
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate('Location');
    }
  };

  const handleSkip = async () => {
    // Check if user already has saved location
    const saved = await AsyncStorage.getItem('@sindi_user_location');
    if (saved) {
      navigation.navigate('Main');
    } else {
      navigation.navigate('Location');
    }
  };

  const onScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setCurrentIndex(index);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={s.header}>
        <View style={s.logoRow}>
          <View style={s.logoBg}>
            <MaterialIcons name="bolt" size={20} color="#0F172A" />
          </View>
          <Text style={s.logoText}>Sindí</Text>
        </View>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={s.slide}>
            {/* Icon */}
            <View style={[s.iconContainer, { backgroundColor: item.iconBg + '18' }]}>
              <View style={[s.iconCircle, { backgroundColor: item.iconBg }]}>
                <MaterialIcons name={item.icon as any} size={48} color={item.iconBg === '#FFD600' ? '#0F172A' : '#ffffff'} />
              </View>
            </View>

            {/* Text */}
            <Text style={s.slideTitle}>{item.title}</Text>
            <Text style={s.slideSub}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Footer */}
      <View style={s.footer}>
        {/* Dots */}
        <View style={s.dotsRow}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.dot, i === currentIndex ? s.dotActive : s.dotInactive]} />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={s.ctaBtn} onPress={handleNext} activeOpacity={0.8}>
          <Text style={s.ctaText}>
            {currentIndex === SLIDES.length - 1 ? 'Set My Location' : 'Next'}
          </Text>
          <MaterialIcons
            name={currentIndex === SLIDES.length - 1 ? 'near-me' : 'arrow-forward'}
            size={20}
            color="#0F172A"
          />
        </TouchableOpacity>

        <Text style={s.termsText}>
          By continuing, you agree to our Terms of Service.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, paddingTop: 20,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoBg: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFD600',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  logoText: { fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  skipText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },

  slide: { width: SCREEN_W, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 40 },
  iconContainer: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center', marginBottom: 36,
  },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  slideTitle: {
    fontSize: 30, fontWeight: '900', color: '#0F172A', textAlign: 'center',
    lineHeight: 38, letterSpacing: -0.5, marginBottom: 14,
  },
  slideSub: {
    fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, paddingHorizontal: 8,
  },

  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  dot: { height: 6, borderRadius: 3, marginHorizontal: 3 },
  dotActive: { width: 24, backgroundColor: '#0F172A' },
  dotInactive: { width: 6, backgroundColor: '#cbd5e1' },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFD600', paddingVertical: 16, borderRadius: 16,
    shadowColor: '#FFD600', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  ctaText: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginRight: 8 },
  termsText: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 12 },
});

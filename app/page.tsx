// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MockWeatherService, WeatherData } from "@/lib/weatherService";
import { findNearestCity } from "@/lib/geolocation";
import Sidebar from "@/components/Sidebar";
import WeatherVisuals from "@/components/WeatherVisuals";
import TiltCard from "@/components/TiltCard";
import { ArtStyle, getStyleForCondition } from "@/data/artStyles";

// UI translations
const ui = {
  atmosphericConditions: { en: "Atmospheric Conditions", zh: "天氣狀況" },
  humidity: { en: "Humidity", zh: "濕度" },
  wind: { en: "Wind", zh: "風速" },
  feelsLike: { en: "Feels Like", zh: "體感溫度" },
  rainChance: { en: "Rain Chance", zh: "降雨機率" },
  region: { en: "Region", zh: "地區" },
  uvIndex: { en: "UV Index", zh: "紫外線" },
  curatedStyle: { en: "Curated Style", zh: "策展風格" },
  outfitGuide: { en: "Outfit Guide", zh: "實用穿搭指南" },
  artistReference: { en: "Artist Reference", zh: "藝術家參考" },
  curating: { en: "Curating collection for", zh: "正在為您策展" },
  selectCity: { en: "Select City", zh: "選擇城市" },
  futureForecast: { en: "Future Forecast", zh: "未來預測" },
  geoDeniedMsg: {
    en: "Location access denied — enable it for local weather & art styles.",
    zh: "定位權限被拒絕 — 開啟以顯示當地即時天氣與藝術風格。",
  },
  geoRetry: { en: "Enable Location", zh: "開啟定位" },
  actualTemp: { en: "Actual Temp", zh: "實際溫度" },
  visibility: { en: "Visibility", zh: "能見度" },
  pressure: { en: "Pressure", zh: "氣壓" },
  windDir: { en: "Wind Dir", zh: "風向" },
  cloudCover: { en: "Cloud Cover", zh: "雲量" },
  sunrise: { en: "Sunrise", zh: "日出" },
  sunset: { en: "Sunset", zh: "日落" },
  airQuality: { en: "Air Quality", zh: "空氣品質" },
  basicInfo: { en: "Basic Info", zh: "基本資訊" },
  proInfo: { en: "Pro Info", zh: "專業資訊" },
};

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [artStyle, setArtStyle] = useState<ArtStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState("Taipei");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "zh">("zh");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [geoDenied, setGeoDenied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Auto-request geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoDenied(true);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const result = findNearestCity(latitude, longitude);
        console.log(`📍 Detected: ${result.city} (${result.distance}km away)`);
        setSelectedCity(result.city);
        setGeoDenied(false);
      },
      (err) => {
        console.warn("Geolocation denied:", err.message);
        setGeoDenied(true);
        setSelectedCity("Taipei");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Fetch weather when city changes
  useEffect(() => {
    setLoading(true);
    async function fetchData() {
      const data = await MockWeatherService.getWeather(selectedCity);
      setWeather(data);
      const match = getStyleForCondition(data.condition);
      setArtStyle(match);
      setLoading(false);
    }
    fetchData();
  }, [selectedCity]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoDenied(true);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const result = findNearestCity(latitude, longitude);
        console.log(`📍 Detected: ${result.city} (${result.distance}km away)`);
        setSelectedCity(result.city);
        setGeoDenied(false);
      },
      (err) => {
        console.warn("Geolocation denied:", err.message);
        setGeoDenied(true);
        setSelectedCity("Taipei");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };



  // Theme Styles
  const themeClasses = theme === "light"
    ? "bg-museum-background text-museum-text selection:bg-museum-accent/20"
    : "bg-[#1A1A18] text-[#F5F2EB] selection:bg-[#F5F2EB]/20";

  return (
    <main className={`min-h-screen ${themeClasses} transition-colors duration-500 overflow-x-hidden relative before:absolute before:inset-0 before:bg-noise before:opacity-[0.15] before:pointer-events-none before:z-0`}>

      {/* Geolocation Denied Banner */}
      <AnimatePresence>
        {geoDenied && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] max-w-lg w-[90%] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg backdrop-blur-md border ${theme === "light"
              ? "bg-white/80 border-museum-accent/30 text-[#333333]"
              : "bg-[#1e1e1e]/90 border-[#FAF9F6]/10 text-[#FAF9F6]"
              }`}
          >
            <span className="text-xl shrink-0">📍</span>
            <p className="text-xs font-sans leading-snug flex-1">
              {ui.geoDeniedMsg[lang]}
            </p>
            <button
              onClick={handleLocateMe}
              className="shrink-0 text-[10px] font-sans font-bold tracking-widest uppercase px-4 py-2 rounded-full bg-museum-accent text-white hover:bg-museum-accent/80 transition-colors"
            >
              {ui.geoRetry[lang]}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logo - Stays under Sidebar Drawer */}
      <div className="fixed top-0 left-0 p-6 md:px-12 md:py-8 z-30 pointer-events-none">
        <div className="text-sm font-sans font-bold tracking-[0.2em] uppercase pointer-events-auto">ArtWeather Muse</div>
      </div>

      {/* Navigation Buttons - Stays above Backdrop */}
      <div className="fixed top-0 right-0 p-6 md:px-12 md:py-8 flex items-center gap-3 z-[60]">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 shadow-sm border ${theme === "light"
            ? "bg-white/80 border-[#2C2C2A]/10 hover:bg-[#2C2C2A] hover:text-white"
            : "bg-black/80 border-white/10 hover:bg-white hover:text-black"
            }`}
          title="Toggle Theme"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        {/* Language Toggle */}
        <button
          onClick={() => setLang(lang === "en" ? "zh" : "en")}
          className={`text-xs font-sans font-bold tracking-widest uppercase backdrop-blur-sm border px-4 py-2 rounded-full transition-all duration-300 shadow-sm ${theme === "light"
            ? "bg-white/80 border-[#2C2C2A]/10 hover:bg-[#2C2C2A] hover:text-white text-[#2C2C2A]"
            : "bg-black/80 border-white/10 hover:bg-white hover:text-black text-white"
            }`}
        >
          {lang === "en" ? "中文" : "EN"}
        </button>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`text-xs font-sans font-bold tracking-widest uppercase backdrop-blur-sm border px-5 py-2 rounded-full transition-all duration-300 shadow-sm flex items-center gap-2 ${theme === "light"
            ? "bg-white/80 border-[#2C2C2A]/10 hover:bg-[#2C2C2A] hover:text-white text-[#2C2C2A]"
            : "bg-[#1A1A18]/80 border-white/10 hover:bg-white hover:text-black text-white"
            }`}
        >
          🌍 {ui.selectCity[lang]}
        </button>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            className="h-screen w-full flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={`w-px h-12 mb-4 animate-pulse ${theme === "light" ? "bg-museum-text/20" : "bg-white/20"}`}></div>
            <p className="text-sm font-serif italic opacity-80">
              {ui.curating[lang]} {selectedCity}...
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={selectedCity}
            className="min-h-screen w-full flex flex-col md:flex-row relative pt-20 md:pt-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Left Panel: Weather Data */}
            <div className={`w-full md:w-5/12 p-6 md:p-12 flex flex-col justify-start md:border-r relative z-20 gap-8 overflow-y-auto custom-scrollbar ${theme === "light" ? "border-neutral-300" : "border-white/10"
              }`}>
              {/* Temperature - Natural Stacking */}
              <div className="relative mt-4 pointer-events-none -ml-4 md:-ml-6">
                <h1 className={`text-9xl md:text-[12rem] font-serif select-none leading-none ${theme === "light" ? "text-[#2C2C2A] opacity-10" : "text-[#FAF9F6] opacity-10"
                  }`}>
                  {weather?.temperature}°
                </h1>
              </div>

              <div className={`z-10 mt-4 md:mt-8`}>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                  <p className="text-xs font-sans font-bold tracking-[0.2em] uppercase opacity-80 mb-2">
                    {ui.atmosphericConditions[lang]}
                  </p>
                  <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 mb-3">
                    <h2 className="text-5xl md:text-6xl font-serif">{weather?.condition}</h2>
                    <span className="text-xl font-sans font-light tracking-wide opacity-80">
                      {lang === "zh" ? weather?.cityCn : weather?.city}
                    </span>
                  </div>
                  <p className="font-serif italic text-xl opacity-90 mb-6">
                    {lang === "zh" ? weather?.descriptionCn : weather?.description}
                  </p>
                </motion.div>
              </div>

              {/* Module 1: Basic Information */}
              <motion.div 
                className={`z-10 rounded-2xl p-6 md:p-8 border backdrop-blur-md shadow-sm ${theme === "light" ? "bg-white/40 border-white/60" : "bg-black/20 border-white/10"}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-xs font-sans font-bold tracking-[0.2em] uppercase opacity-70 mb-6 flex items-center gap-3">
                    <div className="h-px w-6 bg-museum-accent"></div>
                    {ui.basicInfo[lang]}
                </h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <span className="block text-[10px] font-sans tracking-widest uppercase opacity-60 mb-1">{ui.actualTemp[lang]}</span>
                    <span className="font-serif text-2xl">{weather?.temperature}°</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-sans tracking-widest uppercase opacity-60 mb-1">{ui.feelsLike[lang]}</span>
                    <span className="font-serif text-2xl">{weather?.feelsLike}°</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-sans tracking-widest uppercase opacity-60 mb-1">{ui.rainChance[lang]}</span>
                    <span className="font-serif text-2xl">{weather?.precipitationProbability}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-sans tracking-widest uppercase opacity-60 mb-1">{ui.humidity[lang]}</span>
                    <span className="font-serif text-2xl">{weather?.humidity}%</span>
                  </div>
                </div>
              </motion.div>

            </div>

              {/* Right Panel: Immersion & Art */}
            <div className={`w-full md:w-7/12 relative overflow-hidden flex flex-col justify-center p-6 md:p-12 min-h-[500px] perspective-[1200px] ${theme === "light" ? "bg-museum-background" : "bg-[#1A1A18]"
              }`}>
              {/* Weather Visuals Background */}
              {weather && (
                <div className="absolute inset-0 opacity-50 pointer-events-none">
                  <WeatherVisuals condition={weather.condition} />
                </div>
              )}

              <AnimatePresence mode="wait">
                {!showDetails && artStyle && (
                  <TiltCard 
                    key="art-card"
                    theme={theme}
                    weatherCondition={weather?.condition}
                    onClick={() => setShowDetails(true)}
                    className={`w-full p-8 md:p-12 ${theme === "light" ? "border-white/60 bg-white/40 shadow-3d-light" : "border-white/10 bg-black/40 shadow-3d-dark"}`}
                  >
                    <div>
                      <div className="flex items-center gap-4 mb-8">
                        <div className="h-px w-12 bg-museum-accent"></div>
                        <span className="text-xs font-sans font-bold tracking-[0.3em] uppercase text-museum-accent">
                          {ui.curatedStyle[lang]}: {lang === "zh" ? artStyle.nameCn : artStyle.name}
                        </span>
                      </div>

                      <h3 className="text-3xl md:text-5xl font-serif leading-tight mb-8">
                        &ldquo;{lang === "zh" ? artStyle.outfitAdviceCn : artStyle.outfitAdvice}&rdquo;
                      </h3>

                      <div className={`mb-8 p-6 rounded-lg ${theme === "light" ? "bg-white/50 shadow-sm" : "bg-[#FAF9F6]/5 border border-[#FAF9F6]/10"}`}>
                        <h4 className="text-xs font-sans font-bold tracking-[0.2em] uppercase opacity-70 mb-3">
                          {ui.outfitGuide[lang]}
                        </h4>
                        <p className="font-serif text-lg leading-relaxed">
                          {lang === "zh" ? weather?.clothingAdviceCn : weather?.clothingAdvice}
                        </p>
                      </div>

                      <div className={`border-t pt-8 mt-4 ${theme === "light" ? "border-museum-text/10" : "border-white/10"}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-sans tracking-widest uppercase opacity-50 mb-2">{ui.artistReference[lang]}</p>
                            <p className="font-serif text-xl md:text-2xl opacity-90">{artStyle.artistReference}</p>
                          </div>
                          <div className={`text-[10px] font-sans tracking-widest uppercase opacity-50 flex items-center gap-2 animate-pulse`}>
                            {lang === "zh" ? "點擊查看預報與專業資訊" : "View Details"} →
                          </div>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                )}

                {/* Future Forecasts & Professional Info */}
                {showDetails && weather?.forecast && weather.forecast.length > 0 && (
                  <TiltCard
                    key="forecast-card"
                    theme={theme}
                    weatherCondition={weather?.condition}
                    onClick={() => setShowDetails(false)}
                    className={`w-full p-8 md:p-12 ${theme === "light" ? "border-white/60 bg-white/40 shadow-3d-light" : "border-white/10 bg-black/40 shadow-3d-dark"}`}
                  >
                    <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-4 -mr-4">
                        <h4 className="text-xs font-sans font-bold tracking-[0.2em] uppercase opacity-70 mb-6 flex items-center gap-4">
                        <div className="h-px w-8 bg-museum-accent"></div>
                        {ui.futureForecast[lang]}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {weather.forecast.map((day, idx) => (
                            <div key={idx} className={`p-5 rounded-lg ${theme === "light" ? "bg-white/50 shadow-sm" : "bg-[#FAF9F6]/5 border border-[#FAF9F6]/10"}`}>
                            <div className="flex justify-between items-end mb-4">
                                <span className="font-serif text-xl">{new Date(day.date).toLocaleDateString(lang === "zh" ? "zh-TW" : "en-US", { weekday: 'long' })}</span>
                                <span className="font-serif text-lg opacity-80">{day.temperatureMin}° - {day.temperatureMax}°</span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-sans font-bold opacity-80">{day.condition}</span>
                                <span className="text-xs opacity-70">{lang === "zh" ? day.descriptionCn : day.description}</span>
                            </div>
                            <p className="font-serif text-sm leading-relaxed opacity-90 border-t pt-3 border-museum-border/30">
                                {lang === "zh" ? day.clothingAdviceCn : day.clothingAdvice}
                            </p>
                            </div>
                        ))}
                        </div>

                        {/* Professional Information */}
                        <h4 className="text-xs font-sans font-bold tracking-[0.2em] uppercase opacity-70 mb-6 flex items-center gap-4">
                        <div className="h-px w-8 bg-museum-accent"></div>
                        {ui.proInfo[lang]}
                        </h4>
                        <div className={`grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4 p-6 rounded-2xl ${theme === "light" ? "bg-white/30" : "bg-black/20"}`}>
                            <div>
                                <span className="block text-[10px] font-sans tracking-widest uppercase opacity-60 mb-1">{ui.airQuality[lang]}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-serif text-2xl">{weather?.aqi}</span>
                                    <span className="text-xs font-sans opacity-60">AQI</span>
                                </div>
                            </div>
                            <div>
                                <span className="block text-[10px] font-sans tracking-widest uppercase opacity-60 mb-1">PM 2.5</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-serif text-2xl">{weather?.pm25}</span>
                                    <span className="text-xs font-sans opacity-60">µg/m³</span>
                                </div>
                            </div>
                            <div>
                                <span className="block text-[10px] font-sans tracking-widest uppercase opacity-60 mb-1">{ui.wind[lang]}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-serif text-2xl">{weather?.windSpeed}</span>
                                    <span className="text-xs font-sans opacity-60">km/h</span>
                                </div>
                            </div>
                            <div>
                                <span className="block text-[10px] font-sans tracking-widest uppercase opacity-60 mb-1">{ui.windDir[lang]}</span>
                                <span className="font-serif text-2xl">{weather?.windDirection}°</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-sans tracking-widest uppercase opacity-60 mb-1">{ui.pressure[lang]}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-serif text-2xl">{weather?.surfacePressure}</span>
                                    <span className="text-xs font-sans opacity-60">hPa</span>
                                </div>
                            </div>
                            <div>
                                <span className="block text-[10px] font-sans tracking-widest uppercase opacity-60 mb-1">{ui.visibility[lang]}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-serif text-2xl">{weather?.visibility}</span>
                                    <span className="text-xs font-sans opacity-60">km</span>
                                </div>
                            </div>
                            <div>
                                <span className="block text-[10px] font-sans tracking-widest uppercase opacity-60 mb-1">{ui.cloudCover[lang]}</span>
                                <span className="font-serif text-2xl">{weather?.cloudCover}%</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-sans tracking-widest uppercase opacity-60 mb-1">{ui.uvIndex[lang]}</span>
                                <span className="font-serif text-2xl">{weather?.uvIndex}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-sans tracking-widest uppercase opacity-60 mb-1">{ui.sunrise[lang]}</span>
                                <span className="font-serif text-xl">{weather?.sunrise}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-sans tracking-widest uppercase opacity-60 mb-1">{ui.sunset[lang]}</span>
                                <span className="font-serif text-xl">{weather?.sunset}</span>
                            </div>
                        </div>
                        
                        <div className={`border-t pt-8 mt-8 ${theme === "light" ? "border-museum-text/10" : "border-white/10"}`}>
                        <div className="flex justify-end items-center">
                            <div className={`text-[10px] font-sans tracking-widest uppercase opacity-50 flex items-center gap-2 animate-pulse`}>
                            ← {lang === "zh" ? "返回藝術策展" : "Back to Art"} 
                            </div>
                        </div>
                        </div>
                    </div>
                  </TiltCard>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectCity={setSelectedCity}
        selectedCity={selectedCity}
        onLocateMe={handleLocateMe}
        lang={lang}
        theme={theme}
      />
    </main>
  );
}

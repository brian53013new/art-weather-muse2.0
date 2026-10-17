// ArtWeather Muse — Created by Brian&Code Team
// @ts-nocheck
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MockWeatherService, WeatherData } from "@/lib/weatherService";
import { findNearestCity } from "@/lib/geolocation";
import Sidebar from "@/components/Sidebar";
import WeatherVisuals from "@/components/WeatherVisuals";
import TiltCard from "@/components/TiltCard";
import ForecastDrawer from "@/components/ForecastDrawer";
import DetailDialog from "@/components/DetailDialog";
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
const themes: [string, string, string][] = [
  ["classic", "經典高級", "Classic Premium"], ["luxury", "深色奢華", "Dark Luxury"],
  ["minimal", "極簡白", "Minimal White"], ["vintage", "爵士復古", "Vintage Jazz"],
  ["future", "未來科技", "Future Tech"], ["emerald", "自然翡翠", "Emerald Nature"],
];
// Bump this release-scoped key whenever the notice changes so returning visitors
// who dismissed an earlier notice still see this release's update.
const UPDATE_NOTICE_KEY = "artweather-update-notice:2026-10-17:v2";
const OFFICIAL_WEBSITE_URL = "https://brian53013new.github.io/Brian-Code-Official-website/";

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
  const [visualTheme, setVisualTheme] = useState("classic");
  const [showThemes, setShowThemes] = useState(false);
  const [geoStatus, setGeoStatus] = useState("idle");
  const [geoMessage, setGeoMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const [forecastOpen, setForecastOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const updateNoticeTriggerRef = useRef<HTMLElement | null>(null);
  const [updateNoticeOpen, setUpdateNoticeOpen] = useState(false);
  const requestId = useRef(0);
  const locatePending = useRef(false);
  const dismissToast = () => setToastOpen(false);
  const closeDetail = useCallback(() => setDetailItem(null), []);
  const closeUpdateNotice = useCallback(() => {
    setUpdateNoticeOpen(false);
    try { localStorage.setItem(UPDATE_NOTICE_KEY, "seen"); } catch { /* storage unavailable */ }
  }, []);
  const openDetail = (event, item) => {
    detailTriggerRef.current = event.currentTarget;
    setDetailItem(item);
  };
  const metricCard = (label, value, unit, explanation) => (
    <button type="button" key={label} onClick={(event) => openDetail(event, { kind: "metric", title: label, value: value ?? "—", unit, description: typeof explanation === "string" ? explanation : explanation[lang] })}
      className="theme-subcard min-h-20 rounded-xl p-3 text-left transition hover:-translate-y-0.5 focus-visible:outline-offset-2">
      <span className="block text-[10px] font-sans tracking-widest uppercase opacity-70">{label}</span>
      <span className="mt-1 flex items-baseline gap-1"><span className="font-serif text-2xl">{value ?? "—"}</span>{unit && <span className="text-xs opacity-65">{unit}</span>}</span>
      <span className="mt-2 block text-[10px] opacity-55">{lang === "zh" ? "點擊查看說明" : "Open details"}</span>
    </button>
  );
  useEffect(() => {
    if (!toastOpen) return;
    const timer = window.setTimeout(() => setToastOpen(false), 3000);
    const onKey = () => setToastOpen(false);
    const onPointer = () => setToastOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => { window.clearTimeout(timer); window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onPointer); };
  }, [toastOpen, toastKey]);
  useEffect(() => {
    try { const saved = localStorage.getItem("artweather-theme"); if (themes.some(([id]) => id === saved)) setVisualTheme(saved!); } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => {
    try {
      if (localStorage.getItem(UPDATE_NOTICE_KEY) !== "seen") setUpdateNoticeOpen(true);
    } catch {
      setUpdateNoticeOpen(true);
    }
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = visualTheme;
    setTheme(["luxury", "future"].includes(visualTheme) ? "dark" : "light");
    try { localStorage.setItem("artweather-theme", visualTheme); } catch { /* storage unavailable */ }
  }, [visualTheme]);

  // Fetch weather when city changes
  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    MockWeatherService.getWeather(selectedCity).then((data) => {
      if (id !== requestId.current || !data || !data.condition) return;
      setWeather(data); setArtStyle(getStyleForCondition(data.condition)); setLoading(false);
    }).catch(() => { if (id === requestId.current) { setLoading(false); setGeoMessage("天氣資料暫時無法載入，請稍後重試。"); } });
  }, [selectedCity]);

  const requestLocation = (retry: boolean) => {
    if (locatePending.current) return;
    if (!navigator.geolocation) {
      setGeoDenied(true);
      setGeoStatus("unsupported"); setGeoMessage("瀏覽器不支援定位，請手動選擇城市。");
      return;
    }
    locatePending.current = true; setGeoStatus("loading"); setGeoMessage("正在取得位置，僅用於更新當地天氣與穿搭建議…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        locatePending.current = false;
        const { latitude, longitude } = position.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) { setGeoStatus("error"); setGeoMessage("定位座標無效，請手動選擇城市。"); setGeoDenied(true); return; }
        const result = findNearestCity(latitude, longitude);
        setSelectedCity(result.city);
        setGeoDenied(false); setGeoStatus("success"); setGeoMessage(`${result.city} · ${position.coords.accuracy > 10000 ? "概略位置" : `精度約 ${Math.round(position.coords.accuracy)} 公尺`}（最近城市約 ${result.distance} 公里）`); setToastOpen(true); setToastKey(x => x + 1);
      },
      (err) => {
        locatePending.current = false; setGeoDenied(true); setGeoStatus("error");
        if (err.code === err.PERMISSION_DENIED) setGeoMessage("定位權限未開啟。您可以在瀏覽器設定允許定位，或手動選擇城市。");
        else if (retry && err.code === err.TIMEOUT) setTimeout(() => requestLocation(false), 900);
        else setGeoMessage(err.code === err.POSITION_UNAVAILABLE ? "目前無法取得 GPS／網路位置，請稍後重試或手動選擇城市。" : "定位逾時，請重試或手動選擇城市。");
      },
      { enableHighAccuracy: true, timeout: retry ? 18000 : 12000, maximumAge: 60000 }
    );
  };
  const handleLocateMe = () => requestLocation(true);

  // Auto-request geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) { setGeoDenied(true); setGeoStatus("unsupported"); setGeoMessage("瀏覽器不支援定位，您仍可手動選擇城市。"); return; }
    requestLocation(true);
  }, []);



  // Theme Styles
  const themeClasses = theme === "light"
    ? "bg-museum-background text-museum-text selection:bg-museum-accent/20"
    : "bg-[#1A1A18] text-[#F5F2EB] selection:bg-[#F5F2EB]/20";

  return (
      <main data-theme={visualTheme} className={`min-h-screen ${themeClasses} transition-colors duration-500 overflow-x-hidden relative before:absolute before:inset-0 before:bg-noise before:opacity-[0.15] before:pointer-events-none before:z-0`}>

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
              {geoMessage || ui.geoDeniedMsg[lang]}
            </p>
            <button
              onClick={handleLocateMe}
              className="shrink-0 text-[10px] font-sans font-bold tracking-widest uppercase px-4 py-2 rounded-full bg-museum-accent text-white hover:bg-museum-accent/80 transition-colors"
            >
              {ui.geoRetry[lang]}
            </button>
            <button onClick={() => setIsSidebarOpen(true)} className="shrink-0 text-[10px] font-bold px-3 py-2 rounded-full border theme-control">選擇城市</button>
          </motion.div>
        )}
        </AnimatePresence>

      <AnimatePresence>{(geoStatus === "loading" || (geoStatus === "success" && toastOpen)) && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} onClick={dismissToast} className="fixed top-20 left-1/2 -translate-x-1/2 z-40 rounded-full px-4 py-2 text-xs shadow-lg border theme-status cursor-pointer" role="status">{geoStatus === "loading" ? "◌ " : "✓ "}{geoMessage}</motion.div>}</AnimatePresence>

      {/* Logo - Stays under Sidebar Drawer */}
      <div className="fixed top-0 left-0 p-6 md:px-12 md:py-8 z-30 pointer-events-none">
        <div className="text-sm font-sans font-bold tracking-[0.2em] uppercase pointer-events-auto">ArtWeather Muse</div>
      </div>

      {/* Navigation Buttons - Stays above Backdrop */}
      <div className="fixed top-0 right-0 p-6 md:px-12 md:py-8 flex items-center gap-3 z-[60]">
        <button onClick={() => setShowThemes(!showThemes)} aria-expanded={showThemes} className="theme-control text-xs font-bold px-4 py-2 rounded-full border shadow-sm">✦ 風格</button>
        {showThemes && <div className="theme-picker" role="dialog" aria-label="選擇網站風格">{themes.map(([id, zh, en]) => <button key={id} onClick={() => { setVisualTheme(id); setShowThemes(false); }} aria-pressed={visualTheme === id}>{lang === "zh" ? zh : en}{visualTheme === id ? " ✓" : ""}</button>)}</div>}

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
              <motion.button
                type="button"
                onClick={(event) => openDetail(event, { kind: "basic", title: ui.basicInfo[lang], description: `${lang === "zh" ? weather?.cityCn : weather?.city} · ${weather?.condition}` })}
                aria-label={`${ui.basicInfo[lang]}，開啟詳細資訊`}
                className={`z-10 rounded-2xl p-6 md:p-8 border backdrop-blur-md shadow-sm ${theme === "light" ? "bg-white/40 border-white/60" : "bg-black/20 border-white/10"}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileTap={{ scale: 0.995 }}
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
                <span className="mt-6 block text-left text-xs font-medium opacity-65">{lang === "zh" ? "點擊查看完整天氣資訊 →" : "Open full weather details →"}</span>
              </motion.button>
              <button type="button" onClick={() => setForecastOpen(true)} className="theme-control z-10 self-start rounded-full border px-5 py-3 text-sm font-medium transition hover:-translate-y-0.5" aria-label={`${weather?.cityCn || selectedCity}未來七天天氣預報`}>
                {lang === "zh" ? "查看未來 7 天天氣預報 →" : "View the next 7 days →"}
              </button>

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
                            {metricCard(ui.airQuality[lang], weather?.aqi, "AQI", { zh: "空氣品質指數，用來概括目前空氣污染程度。", en: "The Air Quality Index summarizes the current level of air pollution." })}
                            {metricCard("PM 2.5", weather?.pm25, "µg/m³", { zh: "細懸浮微粒濃度；數值越高，空氣中的細粒子越多。", en: "Fine-particle concentration; higher readings mean more PM2.5 in the air." })}
                            {metricCard(ui.wind[lang], weather?.windSpeed, "km/h", { zh: "目前資料中的近地面風速。", en: "Near-surface wind speed in the current weather data." })}
                            {metricCard(ui.windDir[lang], weather?.windDirection, "°", { zh: "風向角度以度數表示，0° 附近代表北風。", en: "Wind direction in degrees; values near 0° indicate northerly wind." })}
                            {metricCard(ui.pressure[lang], weather?.surfacePressure, "hPa", { zh: "目前的地面氣壓資料。", en: "Current surface pressure reported by the weather data." })}
                            {metricCard(ui.visibility[lang], weather?.visibility, "km", { zh: "目前資料估計的水平能見距離。", en: "Estimated horizontal visibility in the current reading." })}
                            {metricCard(ui.cloudCover[lang], weather?.cloudCover, "%", { zh: "天空被雲覆蓋的比例。", en: "The estimated proportion of the sky covered by clouds." })}
                            {metricCard(ui.uvIndex[lang], weather?.uvIndex, "", { zh: "紫外線指數；外出時可依指數採取防曬措施。", en: "UV index; use this reading to guide sun protection outdoors." })}
                            {metricCard(ui.sunrise[lang], weather?.sunrise, "", { zh: "當地資料提供的日出時間。", en: "Local sunrise time supplied by the weather data." })}
                            {metricCard(ui.sunset[lang], weather?.sunset, "", { zh: "當地資料提供的日落時間。", en: "Local sunset time supplied by the weather data." })}
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
        onSelectCity={(city) => { setSelectedCity(city); setGeoDenied(false); setGeoStatus("success"); setGeoMessage(`${city} · 手動選擇`); setToastOpen(true); setToastKey(x => x + 1); }}
        selectedCity={selectedCity}
        onLocateMe={handleLocateMe}
        lang={lang}
        theme={theme}
      />
      {forecastOpen && <ForecastDrawer key={selectedCity} city={weather?.city || selectedCity} lang={lang} onClose={() => setForecastOpen(false)} />}

      <AnimatePresence>
        {updateNoticeOpen && (
          <DetailDialog
            title={lang === "zh" ? "ArtWeather Muse 更新內容" : "What’s new in ArtWeather Muse"}
            description={lang === "zh" ? "天氣資訊與互動體驗已更新。以下是本次主要內容。" : "Weather information and interactions have been updated. Here are the highlights."}
            onClose={closeUpdateNotice}
            triggerRef={updateNoticeTriggerRef}
          >
            <div className="space-y-4">
              <section className="theme-subcard rounded-2xl p-5">
                <h3 className="font-serif text-lg font-semibold">{lang === "zh" ? "城市七日預報" : "Seven-day city forecast"}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{lang === "zh" ? "從各城市天氣卡開啟預報，查看未來七天的天氣、生活建議與藝術語句。" : "Open a city forecast to explore the next seven days, daily guidance, and weather-inspired writing."}</p>
              </section>
              <section className="theme-subcard rounded-2xl p-5">
                <h3 className="font-serif text-lg font-semibold">{lang === "zh" ? "資訊卡片詳細內容" : "Details for weather cards"}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{lang === "zh" ? "點擊基本天氣資訊或專業數據卡，即可展開對應數值與說明。" : "Select basic weather or professional metric cards to see their values and explanations."}</p>
              </section>
              <section className="theme-subcard rounded-2xl p-5">
                <h3 className="font-serif text-lg font-semibold">{lang === "zh" ? "六種網站風格" : "Six visual themes"}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{lang === "zh" ? "經典高級、深色奢華、極簡白、爵士復古、未來科技與自然翡翠，隨時切換。" : "Switch between Classic Premium, Dark Luxury, Minimal White, Vintage Jazz, Future Tech, and Emerald Nature."}</p>
              </section>
              <div className="border-t pt-5" style={{ borderColor: "var(--line)" }}>
                <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{lang === "zh" ? "前往官方網站查看完整更新內容與更多作品。" : "Visit our official website for full update details and more projects."}</p>
                <a href={OFFICIAL_WEBSITE_URL} target="_blank" rel="noopener noreferrer" className="theme-control inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5">
                  {lang === "zh" ? "前往官方網站查看完整內容 ↗" : "Visit the official website ↗"}
                </a>
              </div>
            </div>
          </DetailDialog>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailItem && weather && (
          <DetailDialog title={detailItem.title} description={detailItem.description} onClose={closeDetail} triggerRef={detailTriggerRef}>
            {detailItem.kind === "basic" ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    [ui.actualTemp[lang], `${weather.temperature}°`],
                    [ui.feelsLike[lang], `${weather.feelsLike}°`],
                    [ui.rainChance[lang], `${weather.precipitationProbability}%`],
                    [ui.humidity[lang], `${weather.humidity}%`],
                  ].map(([label, value]) => <div key={label} className="theme-subcard rounded-xl p-4"><p className="text-xs opacity-70">{label}</p><p className="mt-2 font-serif text-2xl">{value}</p></div>)}
                </div>
                <section className="theme-subcard rounded-2xl p-5">
                  <h3 className="font-serif text-lg font-semibold">{lang === "zh" ? "天氣摘要" : "Weather summary"}</h3>
                  <p className="mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>{lang === "zh" ? weather.descriptionCn : weather.description}</p>
                </section>
                <section className="theme-subcard rounded-2xl p-5">
                  <h3 className="font-serif text-lg font-semibold">{ui.outfitGuide[lang]}</h3>
                  <p className="mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>{lang === "zh" ? weather.clothingAdviceCn : weather.clothingAdvice}</p>
                </section>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="theme-subcard rounded-2xl p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-65">{lang === "zh" ? "目前資料" : "Current reading"}</p>
                  <p className="mt-3 font-serif text-5xl">{detailItem.value}<span className="ml-2 text-base opacity-65">{detailItem.unit}</span></p>
                </div>
                <p className="leading-relaxed" style={{ color: "var(--muted)" }}>{detailItem.description}</p>
                <p className="text-xs leading-relaxed opacity-60">{lang === "zh" ? `資料城市：${weather.cityCn || weather.city}。此數值為網站目前天氣資料所提供的觀測資訊。` : `City: ${weather.city}. This value is provided by the current weather data.`}</p>
              </div>
            )}
          </DetailDialog>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={`fixed bottom-0 left-0 right-0 z-50 text-center py-3 px-4 text-[10px] font-sans tracking-widest uppercase transition-colors duration-500 ${theme === "light" ? "text-[#2C2C2A]/40" : "text-[#FAF9F6]/30"}`}>
        © {new Date().getFullYear()} Brian&Code {lang === "zh" ? "團隊出品" : "Team"}. {lang === "zh" ? "更多作品請見" : "More works at"}{" "}
        <a
          href={OFFICIAL_WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-2 transition-colors duration-300 ${theme === "light" ? "hover:text-[#2C2C2A]/80" : "hover:text-[#FAF9F6]/70"}`}
        >
          {lang === "zh" ? "官方網站" : "Official Website"}
        </a>
      </footer>
    </main>
  );
}

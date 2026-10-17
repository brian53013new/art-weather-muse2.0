"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MockWeatherService, SevenDayForecast, DailyWeather } from "@/lib/weatherService";

const cache = new Map<string, SevenDayForecast>();
const icons: Record<string, string> = { Clear: "☀️", Cloudy: "☁️", Rain: "🌧️", Windy: "🌬️", Snow: "❄️" };

function poem(day: DailyWeather, index: number, lang: "zh" | "en") {
  if (lang === "en") {
    const lines = day.condition === "Rain"
      ? ["Clouds soften the city; a quiet rain writes silver lines across the day.", "A passing shower lends the streets a thoughtful, unhurried rhythm."]
      : day.condition === "Clear"
        ? ["Sunlight settles on the city's corners, opening the day in a warm key.", "A clear sky leaves room for bright, easy plans."]
        : day.condition === "Windy"
          ? ["The breeze moves through the streets, carrying the day into a new shape.", "Wind brushes the city awake; a light layer will make the walk gentler."]
          : ["Cloud shadows drift across the city, softening its edges.", "Between light and cloud, the day finds a calm balance."];
    return lines[index % lines.length];
  }
  const lines = day.condition === "Rain"
    ? ["雲層輕覆城市的輪廓，細雨將街道寫成一首安靜的詩。", "一陣微雨替街景添上柔和筆觸，適合放慢腳步。"]
    : day.condition === "Clear"
      ? ["陽光緩緩落在城市的街角，為這一天留下溫暖的序章。", "晴空為城市打開明亮的一頁，適合安排輕快行程。"]
      : day.condition === "Windy"
        ? ["微風穿過街巷，替城市帶來流動的節奏。", "風掠過日常的風景，添一件薄外套會更自在。"]
        : ["天空在明暗之間流轉，雲影為城市增添幾分柔和。", "雲層緩緩移動，城市也因此顯得安定而從容。"];
  return lines[index % lines.length];
}

export default function ForecastDrawer({ city, lang, onClose }: { city: string; lang: "zh" | "en"; onClose: () => void }) {
  const [forecast, setForecast] = useState<SevenDayForecast | null>(cache.get(city) ?? null);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(!cache.has(city));
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [stale, setStale] = useState(false);
  useEffect(() => {
    const cached = cache.get(city);
    if (cached && Date.now() - cached.fetchedAt < 20 * 60 * 1000) { setForecast(cached); setStale(false); setLoading(false); setError(""); return; }
    const staleCache = cached;
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 12000);
    setLoading(true); setError(""); setForecast(null); setSelected(0);
    const load = async () => {
      let lastError: any;
      for (let retry = 0; retry < 2; retry++) {
        try {
          if (retry) await new Promise((resolve, reject) => {
            const t = window.setTimeout(resolve, 700);
            controller.signal.addEventListener("abort", () => { window.clearTimeout(t); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
          });
          const data = await MockWeatherService.getSevenDayForecast(city, controller.signal);
          if (controller.signal.aborted) return;
          cache.set(city, data); setForecast(data); setStale(false); setLoading(false); return;
        } catch (err: any) { lastError = err; if (controller.signal.aborted) break; }
      }
      if (controller.signal.aborted && !timedOut) return;
      if (staleCache) { setForecast(staleCache); setStale(true); }
      setError(`${timedOut ? "預報載入逾時" : lastError?.message || "預報暫時無法載入"}${staleCache ? "，以下為上次成功資料。" : "，請檢查網路後重試。"}`);
      setLoading(false);
    };
    load();
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [city, attempt]);

  const day = forecast?.days[selected];
  const dateLabel = (value: string, weekday = false) => {
    const date = new Date(`${value}T12:00:00`);
    return date.toLocaleDateString(lang === "zh" ? "zh-TW" : "en-US", weekday
      ? { weekday: "short", month: "numeric", day: "numeric" }
      : { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  };
  const analysis = useMemo(() => {
    if (!day) return [];
    const max = day.temperatureMax, min = day.temperatureMin;
    const comfort = (max >= 24 && max <= 29 && min >= 18) ? (lang === "zh" ? "溫度舒適" : "Comfortable temperatures") : max >= 32 ? (lang === "zh" ? "炎熱，安排活動時注意補水與防曬" : "Hot; hydrate and plan for sun protection") : min <= 10 ? (lang === "zh" ? "偏冷，建議加強保暖" : "Cold; add a warm layer") : (lang === "zh" ? "依早晚溫差調整穿著" : "Dress for the temperature range");
    return [comfort,
      day.precipitationProbability === null ? (lang === "zh" ? "降雨風險：暫無預測資料" : "Rain risk: unavailable") : day.precipitationProbability >= 50 ? (lang === "zh" ? "降雨機率較高，外出攜帶雨具" : "Higher rain chance; bring rain gear") : (lang === "zh" ? "降雨機率較低" : "Lower chance of rain"),
      day.windSpeed !== null && day.windSpeed >= 30 ? (lang === "zh" ? "強風提醒：戶外活動留意陣風" : "Wind advisory: watch for gusts") : (lang === "zh" ? "一般戶外活動可依個人舒適度安排" : "Outdoor plans may follow your comfort level")];
  }, [day, lang]);

  return <AnimatePresence>
    <motion.div className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.section role="dialog" aria-modal="true" aria-label={lang === "zh" ? `${city}七日天氣預報` : `${city} seven-day forecast`} className="theme-panel h-full w-full md:max-w-3xl overflow-y-auto shadow-2xl p-5 md:p-9" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.24 }}>
        <header className="flex items-start justify-between gap-4 mb-7">
          <div><p className="text-xs uppercase tracking-[.2em] opacity-65 mb-2">{lang === "zh" ? "七日天氣預報" : "7-day forecast"}</p><h2 className="text-3xl md:text-4xl font-serif">{city}</h2></div>
          <button onClick={onClose} className="theme-control rounded-full border px-4 py-2 min-h-11" aria-label={lang === "zh" ? "關閉預報" : "Close forecast"}>{lang === "zh" ? "返回 ✕" : "Close ✕"}</button>
        </header>
        {loading && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse"><div className="theme-card h-24 rounded-xl"/><div className="theme-card h-24 rounded-xl"/><div className="theme-card h-24 rounded-xl"/><div className="theme-card h-24 rounded-xl"/><p className="col-span-full py-8 opacity-70">{lang === "zh" ? "正在載入這座城市的預報…" : "Loading local forecast…"}</p></div>}
        {!loading && error && <div className="theme-card rounded-2xl p-6"><p role="alert" className="mb-4">{error}</p><button className="theme-control border rounded-full px-5 py-3" onClick={() => setAttempt(x => x + 1)}>{lang === "zh" ? "重新載入" : "Try again"}</button></div>}
        {!loading && forecast && forecast.days.length === 0 && <p className="theme-card rounded-xl p-5" role="status">{lang === "zh" ? "此城市目前沒有可用的七日預報。" : "No seven-day forecast is available for this city."}</p>}
        {!loading && forecast && forecast.days.length > 0 && <>
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6" aria-label={lang === "zh" ? "選擇預報日期" : "Choose forecast date"}>{forecast.days.map((d, i) => <button key={d.date} onClick={() => setSelected(i)} aria-pressed={selected === i} className={`theme-card min-w-[105px] rounded-xl border px-3 py-3 text-left transition ${selected === i ? "ring-2 ring-[var(--accent)]" : ""}`}><span className="block text-xs opacity-70">{dateLabel(d.date, true)}</span><span className="block text-2xl my-1" aria-hidden="true">{icons[d.condition]}</span><span className="block text-sm">{d.temperatureMin}° / {d.temperatureMax}°</span></button>)}</div>
          {!day && <p role="status">{lang === "zh" ? "所選日期缺少預報資料。" : "Forecast data is missing for this date."}</p>}
          {day && <motion.div key={day.date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <section className="theme-card rounded-2xl p-6 md:p-8 mb-5"><p className="text-sm opacity-70">{dateLabel(day.date)}</p><div className="flex items-center gap-4 mt-2"><span className="text-5xl" aria-hidden="true">{icons[day.condition]}</span><div><h3 className="text-2xl font-serif">{day.condition}</h3><p className="opacity-75">{lang === "zh" ? day.descriptionCn : day.description}</p></div></div><div className="flex items-baseline gap-3 my-5"><span className="text-6xl font-serif">{day.temperatureMean ?? "—"}°</span><span className="opacity-75">{day.temperatureMin}° — {day.temperatureMax}°</span><span className="text-sm opacity-60">{lang === "zh" ? "日均 / 最低至最高" : "mean / low to high"}</span></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{[
                [lang === "zh" ? "體感均溫" : "Feels-like mean", day.feelsLikeMean === null ? null : `${day.feelsLikeMean}°`],
                [lang === "zh" ? "降雨機率" : "Rain chance", day.precipitationProbability === null ? null : `${day.precipitationProbability}%`],
                [lang === "zh" ? "預估降雨量" : "Precipitation", day.precipitation === null ? null : `${day.precipitation} mm`],
                [lang === "zh" ? "平均濕度" : "Mean humidity", day.humidity === null ? null : `${day.humidity}%`],
                [lang === "zh" ? "最大風速" : "Max wind", day.windSpeed === null ? null : `${day.windSpeed} km/h`],
                [lang === "zh" ? "主導風向" : "Dominant wind", day.windDirection === null ? null : `${day.windDirection}°`],
        [lang === "zh" ? "紫外線指數" : "UV index", day.uvIndex], [lang === "zh" ? "平均雲量" : "Mean cloud cover", day.cloudCover === null ? null : `${day.cloudCover}%`],
                [lang === "zh" ? "平均 PM2.5" : "Mean PM2.5", day.pm25Mean === null ? null : `${day.pm25Mean} µg/m³`],
                [lang === "zh" ? "歐洲 AQI 均值" : "European AQI mean", day.aqiMean],
                [lang === "zh" ? "日出 / 日落" : "Sunrise / sunset", day.sunrise && day.sunset ? `${day.sunrise} / ${day.sunset}` : null],
              ].map(([label, value]) => <div key={String(label)} className="theme-subcard rounded-xl p-3"><span className="block text-xs opacity-65 mb-1">{label}</span><span className="font-serif text-lg">{value === null || value === undefined ? (lang === "zh" ? "暫無預測資料" : "Unavailable") : value}</span></div>)}</div>
            </section>
            <section className="theme-card rounded-2xl p-6 mb-5"><h3 className="font-serif text-xl mb-4">{lang === "zh" ? "天氣分析與生活建議" : "Daily insight & plans"}</h3><ul className="space-y-2 mb-4">{analysis.map(x => <li key={x}>· {x}</li>)}</ul><p className="text-sm opacity-75">{lang === "zh" ? day.clothingAdviceCn : day.clothingAdvice}</p></section>
            <section className="theme-subcard rounded-2xl p-6 mb-5"><p className="text-xs uppercase tracking-widest opacity-60 mb-2">{lang === "zh" ? "天氣靈感 · 文學描述" : "Weather note · literary interpretation"}</p><p className="font-serif italic text-xl leading-relaxed">「{poem(day, selected, lang)}」</p><p className="text-xs opacity-60 mt-3">{lang === "zh" ? "文學描述依據當日預報生成，非氣象警報。" : "Literary copy reflects the forecast; it is not an alert."}</p></section>
            {stale && <p role="status" className="text-sm font-medium text-amber-700 mb-2">{lang === "zh" ? "目前顯示上次成功更新的預報資料。" : "Showing the last successfully updated forecast."}</p>}
            <p className="text-xs opacity-65 leading-relaxed">{lang === "zh" ? "天氣預測僅供參考，實際天氣可能隨時間變化。空氣品質預測受服務涵蓋天數限制，無資料日期會明確標示。" : "Forecasts are indicative and may change. Air-quality coverage is limited; missing dates are identified."} · {lang === "zh" ? "資料來源" : "Source"}: {forecast.source} · {lang === "zh" ? "更新時間" : "Updated"}: {new Date(forecast.fetchedAt).toLocaleString(lang === "zh" ? "zh-TW" : "en-US")}</p>
          </motion.div>}
        </>}
      </motion.section>
    </motion.div>
  </AnimatePresence>;
}

export type WeatherCondition = "Clear" | "Rain" | "Cloudy" | "Windy" | "Snow";

export type DailyWeather = {
    date: string;
    temperatureMax: number;
    temperatureMin: number;
    condition: WeatherCondition;
    description: string;
    descriptionCn: string;
    clothingAdvice: string;
    clothingAdviceCn: string;
};

export type WeatherData = {
    city: string;
    cityCn: string;
    country: string;
    countryCn: string;
    countryCode: string;
    continent: string;
    continentCn: string;
    temperature: number;
    feelsLike: number;
    condition: WeatherCondition;
    description: string;
    descriptionCn: string;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    surfacePressure: number;
    visibility: number;
    cloudCover: number;
    sunrise: string;
    sunset: string;
    uvIndex: number;
    pm25: number;
    aqi: number;
    precipitation: number;
    precipitationProbability: number;
    clothingAdvice: string;
    clothingAdviceCn: string;
    forecast: DailyWeather[];
};

import { findCityData } from "./cities";
import { getCityCoords } from "./geolocation";

const conditionDescriptions: Record<WeatherCondition, { en: string; cn: string }> = {
    Clear: { en: "Clear skies, bright sunshine", cn: "晴空萬里，陽光明媚" },
    Rain: { en: "Rainfall expected, carry an umbrella", cn: "預計有雨，請攜帶雨具" },
    Cloudy: { en: "Overcast skies, mild temperature", cn: "多雲天氣，氣溫適中" },
    Windy: { en: "Strong gusts, dress in layers", cn: "風勢較強，建議穿著多層" },
    Snow: { en: "Snowfall expected, stay warm", cn: "預計降雪，注意保暖" },
};

function getAdvancedClothingAdvice(temp: number, condition: WeatherCondition): { en: string; cn: string } {
    let adviceEn = "";
    let adviceCn = "";

    // Hot
    if (temp >= 28) {
        if (condition === "Rain") {
            adviceEn = "Breathable short sleeves and shorts. Wear waterproof sandals and bring a compact umbrella.";
            adviceCn = "輕薄透氣短袖搭配短褲，建議穿著防水便鞋，並隨身攜帶輕便摺疊傘。";
        } else if (condition === "Clear") {
            adviceEn = "Lightweight fabrics, sunglasses, and a wide-brimmed hat. High UV protection recommended.";
            adviceCn = "輕盈亞麻材質，配戴墨鏡與寬簷帽。紫外線強烈，請務必加強防曬。";
        } else {
            adviceEn = "Short sleeves and breathable pants. Keep it light and comfortable.";
            adviceCn = "短袖上衣搭配透氣長褲或短褲。以輕便舒適為主。";
        }
    } 
    // Warm
    else if (temp >= 20) {
        if (condition === "Rain") {
            adviceEn = "Light long sleeves and a water-resistant jacket. Don't forget your umbrella.";
            adviceCn = "薄長袖搭配防水防風薄外套，出門別忘了攜帶雨具。";
        } else if (condition === "Windy") {
            adviceEn = "A light windbreaker over a t-shirt, with comfortable jeans.";
            adviceCn = "T恤外搭一件輕薄防風外套，下身搭配舒適的牛仔褲。";
        } else {
            adviceEn = "A light shirt or blouse with casual trousers. Perfect mild weather attire.";
            adviceCn = "薄襯衫或上衣搭配休閒長褲。非常舒適的宜人氣候穿搭。";
        }
    } 
    // Cool
    else if (temp >= 10) {
        if (condition === "Rain") {
            adviceEn = "Waterproof trench coat, warm sweater, and sturdy boots. Carry an umbrella.";
            adviceCn = "防水風衣、保暖毛衣與結實的靴子，並攜帶雨傘防寒防雨。";
        } else if (condition === "Windy") {
            adviceEn = "Layer up: thermal inner wear, a thick sweater, and a wind-blocking coat. Scarf is a plus.";
            adviceCn = "洋蔥式穿搭：發熱衣、厚毛衣與防風大衣，建議搭配圍巾擋風。";
        } else {
            adviceEn = "A warm jacket over a long-sleeve top, paired with thick trousers.";
            adviceCn = "長袖上衣外搭保暖夾克，下身穿著材質較厚的長褲。";
        }
    } 
    // Cold
    else {
        if (condition === "Snow") {
            adviceEn = "Heavy down jacket, thermal layers, wool scarf, gloves, and snow boots.";
            adviceCn = "厚實羽絨外套、多層發熱衣、羊毛圍巾與手套，建議搭配防滑雪靴。";
        } else if (condition === "Windy") {
            adviceEn = "Maximum insulation required. Windproof heavy coat, gloves, and a beanie to protect from biting wind.";
            adviceCn = "需要最高級別保暖。防風厚大衣、手套與毛帽，抵禦刺骨冷風。";
        } else {
            adviceEn = "Winter coat, warm thermal wear, thick socks, and comfortable warm shoes.";
            adviceCn = "冬季大衣、保暖發熱衣、厚襪子與舒適保暖的鞋子。";
        }
    }

    return { en: adviceEn, cn: adviceCn };
}

// WMO Weather interpretation codes
function getWeatherCondition(code: number, windSpeed: number): WeatherCondition {
    if (windSpeed > 30) return "Windy";

    if (code === 0) return "Clear";
    if (code >= 1 && code <= 3) return "Cloudy";
    if (code >= 45 && code <= 48) return "Cloudy";
    if (code >= 51 && code <= 67) return "Rain";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 80 && code <= 82) return "Rain";
    if (code >= 85 && code <= 86) return "Snow";
    if (code >= 95) return "Rain"; 
    return "Cloudy";
}

export const MockWeatherService = {
    async getWeather(cityName: string = "Taipei"): Promise<WeatherData> {
        const coords = getCityCoords(cityName);
        const lat = coords?.lat || 25.033;
        const lon = coords?.lng || 121.565;

        try {
            const [weatherRes, aqiRes] = await Promise.all([
                fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover,visibility&hourly=precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset&timezone=auto`
                ),
                fetch(
                    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,european_aqi&timezone=auto`
                )
            ]);

            if (!weatherRes.ok) throw new Error("Weather API failed");
            
            const data = await weatherRes.json();
            const current = data.current;
            const hourly = data.hourly;
            const daily = data.daily;

            let pm25 = 0;
            let aqi = 0;
            if (aqiRes.ok) {
                const aqiData = await aqiRes.json();
                pm25 = aqiData.current?.pm2_5 || 0;
                aqi = aqiData.current?.european_aqi || 0;
            }

            const currentHourIndex = new Date().getHours();
            const precipProb = hourly.precipitation_probability[currentHourIndex] || 0;

            const temp = Math.round(current.temperature_2m);
            const condition = getWeatherCondition(current.weather_code, current.wind_speed_10m);
            const advice = getAdvancedClothingAdvice(temp, condition);
            const uvIndex = daily.uv_index_max && daily.uv_index_max.length > 0 ? daily.uv_index_max[0] : 0;

            const found = findCityData(cityName);

            // Construct 3-day forecast (Tomorrow, Day After Tomorrow, etc.)
            const forecast: DailyWeather[] = [];
            // Start from index 1 (tomorrow)
            for (let i = 1; i <= 2; i++) {
                if (daily.time[i]) {
                    const dTempMax = Math.round(daily.temperature_2m_max[i]);
                    const dTempMin = Math.round(daily.temperature_2m_min[i]);
                    // Estimate wind to be 10 for daily average since we didn't fetch max wind
                    const dCondition = getWeatherCondition(daily.weather_code[i], 10);
                    const dAdvice = getAdvancedClothingAdvice((dTempMax + dTempMin) / 2, dCondition);
                    
                    forecast.push({
                        date: daily.time[i],
                        temperatureMax: dTempMax,
                        temperatureMin: dTempMin,
                        condition: dCondition,
                        description: conditionDescriptions[dCondition].en,
                        descriptionCn: conditionDescriptions[dCondition].cn,
                        clothingAdvice: dAdvice.en,
                        clothingAdviceCn: dAdvice.cn
                    });
                }
            }

            return {
                city: found?.city.name || cityName,
                cityCn: found?.city.nameCn || cityName,
                country: found?.country.name || "Unknown",
                countryCn: found?.country.nameCn || "未知",
                countryCode: found?.country.code || "📍",
                continent: found?.continent.name || "Unknown",
                continentCn: found?.continent.nameCn || "未知",
                temperature: temp,
                feelsLike: Math.round(current.apparent_temperature),
                condition: condition,
                description: conditionDescriptions[condition].en,
                descriptionCn: conditionDescriptions[condition].cn,
                humidity: current.relative_humidity_2m,
                windSpeed: current.wind_speed_10m,
                windDirection: current.wind_direction_10m || 0,
                surfacePressure: Math.round(current.surface_pressure || 1013),
                visibility: current.visibility ? Math.round(current.visibility / 1000) : 10, // km
                cloudCover: current.cloud_cover || 0,
                sunrise: daily.sunrise && daily.sunrise.length > 0 ? daily.sunrise[0].split("T")[1] : "06:00",
                sunset: daily.sunset && daily.sunset.length > 0 ? daily.sunset[0].split("T")[1] : "18:00",
                uvIndex: uvIndex,
                pm25: pm25,
                aqi: aqi,
                precipitation: current.precipitation,
                precipitationProbability: precipProb,
                clothingAdvice: advice.en,
                clothingAdviceCn: advice.cn,
                forecast: forecast
            };

        } catch (error) {
            console.error("Weather fetch failed, falling back to mock logic", error);
            const fallbackTemp = 20;
            const advice = getAdvancedClothingAdvice(fallbackTemp, "Cloudy");
            return {
                city: cityName,
                cityCn: cityName,
                country: "Unknown",
                countryCn: "未知",
                countryCode: "??",
                continent: "Unknown",
                continentCn: "未知",
                temperature: fallbackTemp,
                feelsLike: 18,
                condition: "Cloudy",
                description: "Data unavailable",
                descriptionCn: "暫無數據",
                humidity: 50,
                windSpeed: 10,
                windDirection: 0,
                surfacePressure: 1013,
                visibility: 10,
                cloudCover: 50,
                sunrise: "06:00",
                sunset: "18:00",
                uvIndex: 0,
                pm25: 0,
                aqi: 0,
                precipitation: 0,
                precipitationProbability: 0,
                clothingAdvice: advice.en,
                clothingAdviceCn: advice.cn,
                forecast: []
            };
        }
    },
};

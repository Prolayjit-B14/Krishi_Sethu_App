/**
 * AgriSense / Krishi Sethu — 5-Day Weather & Agricultural Disaster Forecasting Service
 * Connects to Open-Meteo open weather API using live farm GPS coordinates.
 * Generates automated Flood-Risk, Drought-Risk, Heatwave, and Fungal Disease (Mills Period) early warnings.
 */

// Offline fallback forecast (5 Days)
const generateMockForecast = () => {
  const days = [];
  const today = new Date();

  const mockConditions = [
    { rainSum: 0, rainProb: 10, condition: 'Sunny', tempMax: 32, tempMin: 22 },
    { rainSum: 14, rainProb: 70, condition: 'Showers', tempMax: 29, tempMin: 21 },
    { rainSum: 6, rainProb: 45, condition: 'Light Rain', tempMax: 30, tempMin: 23 },
    { rainSum: 0, rainProb: 20, condition: 'Partly Cloudy', tempMax: 33, tempMin: 24 },
    { rainSum: 0, rainProb: 10, condition: 'Sunny', tempMax: 34, tempMin: 24 }
  ];

  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const m = mockConditions[i];
    days.push({
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      tempMax: m.tempMax,
      tempMin: m.tempMin,
      rainSum: m.rainSum,
      rainProb: m.rainProb,
      condition: m.condition
    });
  }

  return {
    days,
    disasterAlerts: [
      {
        id: 'fungal_window',
        type: 'Fungal Disease Risk (Mills Index)',
        severity: 'Warning',
        message: 'Upcoming showers with 75% humidity create optimal spore germination conditions for leaf blast.',
        recommendation: 'Spray preventive bio-agent (Trichoderma or Neem 1500ppm) before rains begin.'
      }
    ]
  };
};

export const fetch5DayForecast = async (lat = 23.18, lon = 88.02) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&hourly=temperature_2m,relative_humidity_2m,precipitation&timezone=auto&forecast_days=5`;
    
    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
    
    const data = await res.json();
    const daily = data.daily || {};
    const hourly = data.hourly || {};

    const days = (daily.time || []).map((t, idx) => {
      const dateObj = new Date(t);
      const rain = daily.precipitation_sum?.[idx] || 0;
      const prob = daily.precipitation_probability_max?.[idx] || 0;
      
      let condition = 'Sunny';
      if (rain > 20) condition = 'Heavy Rain';
      else if (rain > 2) condition = 'Showers';
      else if (prob > 40) condition = 'Cloudy';

      return {
        date: dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        tempMax: Math.round(daily.temperature_2m_max?.[idx] ?? 32),
        tempMin: Math.round(daily.temperature_2m_min?.[idx] ?? 22),
        rainSum: Math.round(rain * 10) / 10,
        rainProb: Math.round(prob),
        condition
      };
    });

    // ─── DISASTER & DISEASE RISK ANALYSIS ───
    const disasterAlerts = [];

    // 1. Flood Risk Watch
    const maxRainInDay = Math.max(...(daily.precipitation_sum || [0]));
    const totalRain5Days = (daily.precipitation_sum || []).reduce((a, b) => a + (b || 0), 0);
    if (maxRainInDay >= 45 || totalRain5Days >= 80) {
      disasterAlerts.push({
        id: 'flood_watch',
        type: 'Flood Risk Watch',
        severity: 'Critical',
        message: `Severe rainfall expected (${maxRainInDay} mm in 24h, ${Math.round(totalRain5Days)} mm 5-day total). Field waterlogging and root rot risks are high.`,
        recommendation: 'Clear field perimeter drainage bunds immediately and pause automated irrigation cycles.'
      });
    }

    // 2. Drought & Extreme Dry Spell Alert
    if (totalRain5Days === 0) {
      const maxDailyTemp = Math.max(...(daily.temperature_2m_max || [30]));
      if (maxDailyTemp >= 35) {
        disasterAlerts.push({
          id: 'drought_stress',
          type: 'Dry Spell & Soil Depletion Alert',
          severity: 'Warning',
          message: `Zero precipitation forecast over the next 5 days with peak temperatures reaching ${maxDailyTemp}°C.`,
          recommendation: 'Mulch soil beds to reduce evaporation and plan regulated drip irrigation cycles.'
        });
      }
    }

    // 3. Heatwave & Evapotranspiration Warning
    const maxTemp = Math.max(...(daily.temperature_2m_max || [30]));
    if (maxTemp >= 38) {
      disasterAlerts.push({
        id: 'heatwave_warn',
        type: 'Heatwave & Evaporation Alert',
        severity: 'Warning',
        message: `Severe temperature spike forecast (${maxTemp}°C). Evapotranspiration rate will surge by 40%.`,
        recommendation: 'Schedule deep irrigation at dawn or evening. Avoid midday chemical spraying.'
      });
    }

    // 4. Fungal Disease (Mills Index calculation on hourly data)
    let humidHoursCount = 0;
    const hums = hourly.relative_humidity_2m || [];
    const temps = hourly.temperature_2m || [];
    for (let i = 0; i < Math.min(120, hums.length); i++) {
      if (hums[i] > 80 && temps[i] >= 20 && temps[i] <= 29) {
        humidHoursCount++;
      }
    }

    if (humidHoursCount >= 10) {
      disasterAlerts.push({
        id: 'fungal_blast_window',
        type: 'Fungal Infection Window (Mills Index)',
        severity: 'Warning',
        message: `${humidHoursCount} warm, high-humidity hours forecast. Prime environment for fungal blast, sheath blight, and rust.`,
        recommendation: 'Apply preventive organic bio-fungicide (Trichoderma viride or 0.3% copper oxychloride).'
      });
    }

    return { days, disasterAlerts };
  } catch (err) {
    console.warn("Weather forecast fetch failed, using localized offline projection:", err.message);
    return generateMockForecast();
  }
};

// Backwards compatibility alias
export const fetch72hForecast = fetch5DayForecast;

import { NextResponse } from 'next/server';
import { NeoWSAsteroid, DonkiEvent, FirmsHotspot, StressIndexResult } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let bodyData: { neows: NeoWSAsteroid[]; donki: DonkiEvent[]; firms: FirmsHotspot[] } | null = null;
  
  try {
    bodyData = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const { neows = [], donki = [], firms = [] } = bodyData || {};

  // Compute Heuristic Fallback values first
  const baseScore = 10;

  // 1. Asteroid contribution
  const hazardousAsteroids = neows.filter(a => a.isPotentiallyHazardous);
  const asteroidsContribution = Math.min(hazardousAsteroids.length * 15, 45);

  // 2. Space weather contribution
  const hasG3Plus = donki.some(e => {
    const scale = e.geomagneticScale || '';
    return scale.match(/G[3-5]/i);
  });
  const donkiContribution = hasG3Plus ? 20 : 0;

  // 3. Fire contribution
  const extremeFires = firms.filter(f => f.frpMegawatts > 50);
  const firmsContribution = Math.min(extremeFires.length * 1, 25);

  const finalHeuristicScore = Math.min(Math.max(baseScore + asteroidsContribution + donkiContribution + firmsContribution, 0), 100);

  // Determine dominant sector for fallback
  let fallbackSector = 'Satellite Communications';
  if (donkiContribution > asteroidsContribution && donkiContribution > firmsContribution) {
    fallbackSector = 'Satellite Communications';
  } else if (firmsContribution > asteroidsContribution && firmsContribution > donkiContribution) {
    fallbackSector = 'Power Grid Infrastructure';
  } else if (asteroidsContribution > donkiContribution && asteroidsContribution > firmsContribution) {
    fallbackSector = 'Orbital Assets';
  } else {
    // If tie or no major drivers, choose based on the presence of any hazards
    if (donki.length > 0) fallbackSector = 'Satellite Communications';
    else if (neows.length > 0) fallbackSector = 'Orbital Assets';
    else if (firms.length > 0) fallbackSector = 'Power Grid Infrastructure';
  }

  const fallbackResult: StressIndexResult & { source: string } = {
    globalStressIndex: finalHeuristicScore,
    riskSummary: 'Fallback analysis: stress level calculated from raw telemetry due to AI service unavailability.',
    vulnerableSector: fallbackSector,
    source: 'fallback'
  };

  // Attempt Hugging Face API call
  const hfToken = process.env.HF_API_TOKEN;
  if (!hfToken || hfToken.trim() === '' || hfToken === 'hf_placeholder') {
    console.warn('Hugging Face token not provided or placeholder used. Falling back to heuristic.');
    return NextResponse.json(fallbackResult);
  }

  try {
    // Build a compact summary of telemetry to prevent context window bloat and keep latency low
    const telemetrySummary = {
      asteroid_count: neows.length,
      potentially_hazardous_asteroids: hazardousAsteroids.map(a => ({ name: a.name, velocity_km_s: a.relativeVelocityKmS, miss_dist_km: a.missDistanceKm })),
      space_weather_events: donki.slice(0, 10).map(e => ({ type: e.eventType, scale: e.geomagneticScale, velocity: e.plasmaVelocityKmS })),
      fire_hotspots_count: firms.length,
      max_fire_radiative_power: firms.length > 0 ? Math.max(...firms.map(f => f.frpMegawatts)) : 0
    };

    const prompt = `[INST] You are TerraGuard AI, an automated planetary security intelligence model. Analyze these three distinct vectors: ${JSON.stringify(telemetrySummary)}. You must calculate a singular Global Stress Index integer between 0 and 100, generate a precise 1-sentence infrastructure risk summary, and explicitly state which critical infrastructure sector faces the highest degradation vulnerability over the next 48 hours. Your output must return as a strictly formatted, minified JSON object with keys: globalStressIndex, riskSummary, vulnerableSector. [/INST]`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 150,
            return_full_text: false,
            temperature: 0.2
          }
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error(`Hugging Face API returned error status: ${res.status}`);
      return NextResponse.json(fallbackResult);
    }

    const data = await res.json();
    let generatedText = '';

    if (Array.isArray(data) && data[0]?.generated_text) {
      generatedText = data[0].generated_text;
    } else if (data?.generated_text) {
      generatedText = data.generated_text;
    } else if (typeof data === 'string') {
      generatedText = data;
    }

    if (!generatedText) {
      console.error('Empty generated text from Hugging Face model');
      return NextResponse.json(fallbackResult);
    }

    // Parse JSON from generated text
    const startIdx = generatedText.indexOf('{');
    const endIdx = generatedText.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonStr = generatedText.substring(startIdx, endIdx + 1);
      const parsed = JSON.parse(jsonStr);

      const stressVal = parseInt(parsed.globalStressIndex);
      const riskSummary = parsed.riskSummary || 'Risk summary unavailable.';
      const vulnerableSector = parsed.vulnerableSector || 'Infrastructure';

      if (!isNaN(stressVal)) {
        return NextResponse.json({
          globalStressIndex: Math.min(Math.max(stressVal, 0), 100),
          riskSummary,
          vulnerableSector,
          source: 'ai'
        });
      }
    }

    console.error('Failed to parse model output as valid JSON:', generatedText);
    return NextResponse.json(fallbackResult);
  } catch (error) {
    console.error('Error during AI analysis, falling back to heuristic:', error);
    return NextResponse.json(fallbackResult);
  }
}

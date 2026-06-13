import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // Strict 10-second deadline

  try {
    const body = await request.json();
    const { neows, donki, firms } = body;

    const hfToken = process.env.HF_API_TOKEN;
    
    // If token is missing, intentionally drop straight to fallback routine
    if (!hfToken || hfToken.includes('placeholder')) {
      throw new Error('HF token missing');
    }

    const systemPrompt = `You are TerraGuard AI, an automated planetary security intelligence model. Analyze these three distinct vectors: Asteroids: ${JSON.stringify(neows)}, Space Weather: ${JSON.stringify(donki)}, Thermal Hotspots: ${JSON.stringify(firms)}. You must calculate a singular Global Stress Index integer between 0 and 100, generate a precise 1-sentence infrastructure risk summary, and explicitly state which critical infrastructure sector faces the highest degradation vulnerability over the next 48 hours. Your output must return as a strictly formatted, minified JSON object with keys: globalStressIndex, riskSummary, vulnerableSector.`;

    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: systemPrompt, parameters: { max_new_tokens: 200, return_full_text: false } }),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!hfResponse.ok) throw new Error('Hugging Face engine rejected request');

    const resData = await hfResponse.json();
    const rawText = Array.isArray(resData) ? resData[0]?.generated_text : resData?.generated_text;
    
    // Sanitize string to handle any markdown backticks code-block wrapping the model might add
    const jsonMatch = rawText.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error('Failed to isolate clean JSON structure');

    const parsedAI = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json({
      globalStressIndex: Number(parsedAI.globalStressIndex) || 0,
      riskSummary: parsedAI.riskSummary || 'Threat matrix analysis processed securely via AI clusters.',
      vulnerableSector: parsedAI.vulnerableSector || 'Global Communications Infrastructure',
      source: 'ai'
    });

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.log('--- ENTERING ANTI-GRAVITY LOCAL FALLBACK BRAIN ---');
    
    // Pull payloads again from body request safely for fallback calculations
    let reqBody: any = {};
    try { reqBody = await request.clone().json(); } catch(e){}
    const asteroids = reqBody.neows || [];
    const donkiEvents = reqBody.donki || [];
    const hotspots = reqBody.firms || [];

    // Local Fallback Heuristic Calculation Layer
    let baseScore = 12;
    
    const hazardAsteroids = asteroids.filter((a: any) => a.isPotentiallyHazardous).length;
    baseScore += Math.min(hazardAsteroids * 15, 45);

    const highGScale = donkiEvents.some((d: any) => d.geomagneticScale && d.geomagneticScale !== 'none' && d.geomagneticScale !== 'G1');
    if (highGScale) baseScore += 25;

    const extremeFires = hotspots.filter((h: any) => h.frpMegawatts > 50).length;
    baseScore += Math.min(extremeFires * 1.5, 20);

    const finalScore = Math.min(Math.max(baseScore, 0), 100);

    let primarySector = 'Satellite Communications Grid';
    if (extremeFires > hazardAsteroids && extremeFires > (highGScale ? 1 : 0)) {
      primarySector = 'Power Grid Infrastructure';
    } else if (hazardAsteroids > extremeFires) {
      primarySector = 'Orbital Assets Sector';
    }

    return NextResponse.json({
      globalStressIndex: finalScore,
      riskSummary: 'Local execution backup: Threat index computed via static telemetry profiles due to cloud service timeout parameters.',
      vulnerableSector: primarySector,
      source: 'fallback'
    });
  }
}

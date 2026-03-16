import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEPT_MAPPING: Record<string, string> = {
  "Roads": "9be18a11-93f1-49db-b45c-0e34ce924e8e",
  "Sanitation": "6a5e72b9-dc0f-4b6b-95ab-67fb3b22aa10",
  "Water": "029b0c2a-78a4-46d2-9bc5-d1cd36bd0c25",
  "Safety": "b3ce8772-c2e3-474e-b703-f82e245c8147",
  "Electricity": "3b5d19bb-979e-4818-a062-28e0ce77744a",
  "Parks": "18149177-709c-45fd-88ca-598bc5f5e913"
};

// Helper function to safely convert Uint8Array to Base64 without blowing the stack
function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binary = "";
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let cid = "unknown";

  try {
    const { complaint_id } = await req.json();
    cid = complaint_id;
    console.log(`[PROCESS] Complaint ${cid}: Request start.`);

    // 1. Fetch record
    const { data: complaint, error: fErr } = await supabase
      .from("complaints")
      .select("*")
      .eq("id", cid)
      .single();

    if (fErr || !complaint) throw new Error("Metadata fetch failed or record missing.");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY environment variable is not set.");

    // Guard: Prevent re-processing if already completed
    if (complaint.analysis_status === "completed") {
      console.log(`[PROCESS] Complaint ${cid}: Already completed. Skipping.`);
      return new Response(JSON.stringify({ success: true, message: "Already processed" }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 2. Set status to processing
    await supabase.from("complaints").update({ analysis_status: "processing" }).eq("id", cid);

    const promptText = `Act as a senior civic engineer. Analyze this complaint and provide a structured JSON response. 
    Category must be one of: Roads, Sanitation, Water, Safety, Electricity, Parks.
    Severity/Urgency/Public Impact are 1-5 scale numbers.
    Summary is a 1-sentence overview.
    Resolution Prediction is an estimate of time/effort.
    
    Description: ${complaint.description}
    
    Return ONLY raw JSON with these strictly typed keys: 
    { "category": string, "severity": number, "urgency": number, "public_impact": number, "ai_summary": string, "resolution_prediction": string }`;

    const parts = [{ text: promptText }];

    // 3. Handle Multimodal Input (Image)
    if (complaint.image_url) {
      console.log(`[PROCESS] Complaint ${cid}: Processing image ${complaint.image_url}...`);
      const { data: { publicUrl } } = supabase.storage.from("complaint-images").getPublicUrl(complaint.image_url);
      const iRes = await fetch(publicUrl);
      
      if (iRes.ok) {
        const ab = await iRes.arrayBuffer();
        const base64 = uint8ArrayToBase64(new Uint8Array(ab));
        parts.push({ 
          inline_data: { 
            mime_type: iRes.headers.get("Content-Type") || "image/jpeg", 
            data: base64 
          } 
        } as any);
      } else {
        console.warn(`[WARN] Complaint ${cid}: Image download failed. Proceeding with text.`);
      }
    }

    // 4. Call Gemini 2.5 Flash
    const model = "gemini-2.5-flash";
    console.log(`[PROCESS] Complaint ${cid}: Requesting analysis from model: ${model}`);
    
    const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const gRes = await fetch(gUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        contents: [{ parts }], 
        generationConfig: { response_mime_type: "application/json", temperature: 0.1 } 
      })
    });

    console.log(`[PROCESS] Complaint ${cid}: Gemini response status: ${gRes.status}`);

    if (!gRes.ok) {
      const errText = await gRes.text();
      throw new Error(`Gemini API Error: ${errText}`);
    }
    
    const gData = await gRes.json();
    let aiText = gData.candidates[0].content.parts[0].text;
    
    // Clean and parse
    aiText = aiText.replace(/```json\n?/, "").replace(/\n?```/, "").trim();
    console.log(`[PROCESS] Complaint ${cid}: Parsed output: ${aiText}`);
    const aiData = JSON.parse(aiText);

    // 5. Calculate Score & Update Supabase
    const s = Number(aiData.severity) || 1;
    const u = Number(aiData.urgency) || 1;
    const i = Number(aiData.public_impact) || 1;
    const score = (s * 0.4) + (u * 0.4) + (i * 0.2);

    console.log(`[PROCESS] Complaint ${cid}: Updating Supabase result...`);

    const { error: uErr } = await supabase.from("complaints").update({
      category: aiData.category,
      severity: s,
      urgency: u,
      public_impact: i,
      priority_score: score,
      ai_summary: aiData.ai_summary,
      resolution_prediction: aiData.resolution_prediction,
      department_id: DEPT_MAPPING[aiData.category] || null,
      analysis_status: "completed",
      error_message: null
    }).eq("id", cid);

    if (uErr) throw new Error(`Database update failed: ${uErr.message}`);

    console.log(`[PROCESS] Complaint ${cid}: Processing fully completed.`);

    return new Response(JSON.stringify({ success: true, data: { ...aiData, priority_score: score } }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (e: any) {
    console.error(`[ERROR] Complaint ${cid}: ${e.message}`);
    if (cid !== "unknown") {
      await supabase.from("complaints").update({ 
        analysis_status: "failed", 
        error_message: e.message 
      }).eq("id", cid);
    }
    return new Response(JSON.stringify({ success: false, error: e.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});

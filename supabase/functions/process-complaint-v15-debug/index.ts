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
  "Roads & Bridges": "9be18a11-93f1-49db-b45c-0e34ce924e8e",
  "Sanitation & Waste": "6a5e72b9-dc0f-4b6b-95ab-67fb3b22aa10",
  "Water & Sewage": "029b0c2a-78a4-46d2-9bc5-d1cd36bd0c25",
  "Public Safety": "b3ce8772-c2e3-474e-b703-f82e245c8147",
  "Electricity & Lighting": "3b5d19bb-979e-4818-a062-28e0ce77744a",
  "Parks & Recreation": "18149177-709c-45fd-88ca-598bc5f5e913"
};

function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const payload = await req.json();
    let { 
      user_id, 
      description, 
      image_url, 
      latitude, 
      longitude, 
      location_label 
    } = payload;

    // MANDATORY LOCATION CHECK
    if (!latitude || !longitude || !location_label) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Location is mandatory. Please provide a valid location.",
        status: "missing_location"
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (user_id === "undefined" || !user_id) user_id = null;

    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY environment variable is not set.");

    // 1. Initial AI Analysis & Fake Detection
    const analysisPrompt = `Act as a senior civic engineer and security analyst. 
    Analyze this civic complaint description and image (if provided).
    
    Tasks:
    1. Determine if this is a GENUINE civic issue (e.g., potholes, trash, broken lights) or a FAKE/SUSPICIOUS/NONSENSE report.
    2. If genuine, select the best CATEGORY from: Roads & Bridges, Sanitation & Waste, Water & Sewage, Public Safety, Electricity & Lighting, Parks & Recreation.
    3. If genuine, provide 1-5 scores for severity, urgency, and public_impact.
    4. Provide a 1-sentence AI Summary.
    5. Provide a Resolution Prediction (e.g., "7 days").
    6. Provide a DETAILED Visual Description/Fingerprint of the physical problem.

    Description: ${description || "No description provided."}

    Return ONLY raw JSON:
    { 
      "is_fake": boolean, 
      "rejection_reason": string,
      "category": string, 
      "severity": number, 
      "urgency": number, 
      "public_impact": number, 
      "ai_summary": string, 
      "resolution_prediction": string, 
      "visual_description": string 
    }`;

    const parts: any[] = [{ text: analysisPrompt }];
    if (image_url) {
      try {
        const { data } = supabase.storage.from("complaint-images").getPublicUrl(image_url);
        if (data?.publicUrl) {
          const imgRes = await fetch(data.publicUrl);
          if (imgRes.ok) {
            const buf = await imgRes.arrayBuffer();
            parts.push({ 
              inlineData: { 
                mimeType: imgRes.headers.get("Content-Type") || "image/jpeg", 
                data: uint8ArrayToBase64(new Uint8Array(buf)) 
              } 
            });
          }
        }
      } catch (e) {}
    }

    // Using gemini-2.5-flash
    const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const gRes = await fetch(gUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        contents: [{ parts }], 
        generationConfig: { 
          responseMimeType: "application/json", 
          temperature: 0.1 
        } 
      })
    });

    if (!gRes.ok) throw new Error(`Gemini API Error: ${await gRes.text()}`);
    
    const gData = await gRes.json();
    const aiText = gData.candidates[0].content.parts[0].text;
    const aiData = JSON.parse(aiText.trim());

    if (aiData.is_fake) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: aiData.rejection_reason || "Invalid report content.",
        status: "rejected"
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Duplicate Detection
    const { data: candidates } = await supabase.rpc('get_nearby_issues', {
      lat: latitude, lng: longitude, radius_meters: 100, target_category: aiData.category
    });

    let matchedIssueId = null;
    if (candidates && candidates.length > 0) {
      const matchPrompt = `Is it the SAME physical problem? New: ${aiData.visual_description}. Existing: ${candidates.map((c: any, i: number) => `${i}. ${c.visual_description}`).join('\n')}. Return index or "none".`;
      const mRes = await fetch(gUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: matchPrompt }] }], generationConfig: { temperature: 0.1 } })
      });
      if (mRes.ok) {
        const mData = await mRes.json();
        const mText = mData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.toLowerCase();
        const mIdx = parseInt(mText);
        if (!isNaN(mIdx) && candidates[mIdx]) matchedIssueId = candidates[mIdx].id;
      }
    }

    if (matchedIssueId && user_id) {
      const { data: existing } = await supabase.from("reports").select("id").eq("issue_id", matchedIssueId).eq("user_id", user_id).maybeSingle();
      if (existing) return new Response(JSON.stringify({ success: false, error: "Duplicate report.", status: "duplicate_user" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Create/Update Issue
    let finalIssueId = matchedIssueId;
    let status = matchedIssueId ? "matched" : "new";

    if (!finalIssueId) {
      const { data: newIssue, error: iErr } = await supabase.from("issues").insert({
        title: aiData.ai_summary.substring(0, 50),
        category: aiData.category,
        severity: aiData.severity,
        urgency: aiData.urgency,
        public_impact: aiData.public_impact,
        priority_score: (aiData.severity * 0.4) + (aiData.urgency * 0.4) + (aiData.public_impact * 0.2),
        report_count: 1,
        latitude, longitude, location_label,
        ai_summary: aiData.ai_summary,
        visual_description: aiData.visual_description,
        department_id: DEPT_MAPPING[aiData.category] || null,
        image_url
      }).select().single();
      if (iErr) throw iErr;
      finalIssueId = newIssue.id;
    } else {
      await supabase.from("issues").update({ last_report_at: new Date().toISOString() }).eq("id", finalIssueId);
    }

    // 4. Create Report
    const { data: report, error: rErr } = await supabase.from("reports").insert({
      title: aiData.ai_summary.substring(0, 50),
      description, image_url, user_id, issue_id: finalIssueId,
      latitude, longitude, location_label,
      analysis_status: "completed"
    }).select().single();
    if (rErr) throw rErr;

    return new Response(JSON.stringify({ success: true, status, data: { ...aiData, summary: aiData.ai_summary } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

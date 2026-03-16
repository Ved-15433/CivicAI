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
  let reportId: string | null = null;

  try {
    const payload = await req.json();
    let { 
      user_id, 
      title: inputTitle, 
      description, 
      image_url, 
      latitude, 
      longitude, 
      location_label 
    } = payload;

    if (user_id === "undefined" || !user_id) user_id = null;

    console.log(`[PROCESS] Starting processing for User: ${user_id || 'anonymous'}`);

    // Create initial report row to track progress
    const { data: initialReport, error: initErr } = await supabase.from("reports").insert({
      title: inputTitle || "Civic Report",
      description: description || "No description provided",
      image_url: image_url,
      user_id: user_id,
      latitude: latitude,
      longitude: longitude,
      location_label: location_label,
      analysis_status: "processing"
    }).select().single();

    if (initErr) throw new Error(`Failed to initialize report record: ${initErr.message}`);
    reportId = initialReport.id;
    console.log(`[PROCESS] Created initial report record: ${reportId}`);

    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY environment variable is not set.");

    // 1. Initial AI Analysis & Visual Fingerprinting
    const analysisPrompt = `Act as a senior civic engineer. Analyze this complaint image and description.
    Category: Select from Roads, Sanitation, Water, Safety, Electricity, Parks.
    Stats: Provide 1-5 scores for severity, urgency, and public_impact.
    AI Summary: 1-sentence overview.
    Resolution Prediction: Estimated time to fix.
    Visual Description: Provide a DETAILED visual fingerprint of the specific problem. Focus on unique identifiers.

    Description: ${description || "No description provided."}

    Return ONLY raw JSON:
    { "category": string, "severity": number, "urgency": number, "public_impact": number, "ai_summary": string, "resolution_prediction": string, "visual_description": string }`;

    const parts = [{ text: analysisPrompt }];
    if (image_url) {
      try {
        const { data } = supabase.storage.from("complaint-images").getPublicUrl(image_url);
        const publicUrl = data?.publicUrl;
        if (publicUrl) {
          const imgRes = await fetch(publicUrl);
          if (imgRes.ok) {
            const buf = await imgRes.arrayBuffer();
            const base64 = uint8ArrayToBase64(new Uint8Array(buf));
            parts.push({ inline_data: { mime_type: imgRes.headers.get("Content-Type") || "image/jpeg", data: base64 } } as any);
          }
        }
      } catch (imgErr: any) {
        console.warn(`[PROCESS] Non-fatal image fetch error: ${imgErr.message}`);
      }
    }

    const modelName = "gemini-2.5-flash";
    const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log(`[GEMINI] Requesting analysis from ${modelName}...`);
    const gRes = await fetch(gUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        contents: [{ parts }], 
        generationConfig: { response_mime_type: "application/json", temperature: 0.1 } 
      })
    });

    if (!gRes.ok) {
      const errText = await gRes.text();
      console.error(`[GEMINI ERROR] ${gRes.status}: ${errText}`);
      throw new Error(`Gemini API Error (${gRes.status}): ${errText}`);
    }

    const gData = await gRes.json();
    if (!gData.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Gemini returned empty response.");
    }

    const aiText = gData.candidates[0].content.parts[0].text;
    console.log(`[GEMINI] Raw Response: ${aiText.substring(0, 200)}...`);

    let aiData;
    try {
      aiData = JSON.parse(aiText.replace(/```json\n?/, "").replace(/\n?```/, "").trim());
    } catch (parseErr) {
      console.error("[JSON ERROR] Parse failed:", aiText);
      throw new Error("AI analysis returned invalid JSON format.");
    }

    aiData.severity = Number(aiData.severity) || 3;
    aiData.urgency = Number(aiData.urgency) || 3;
    aiData.public_impact = Number(aiData.public_impact) || 3;

    // 2. Duplicate Detection
    console.log(`[PROCESS] Running duplicate check for ${aiData.category}...`);
    const { data: candidates, error: rpcErr } = await supabase.rpc('get_nearby_issues', {
      lat: latitude,
      lng: longitude,
      radius_meters: 100,
      target_category: aiData.category
    });

    let matchedIssueId = null;
    if (candidates && candidates.length > 0) {
      const matchPrompt = `Is this new report the SAME EXACT physical problem as any existing ones?
      New Report: ${aiData.visual_description}
      Existing: ${candidates.map((c: any, i: number) => `${i}. ${c.visual_description}`).join('\n')}
      Return ONLY the index number or "none".`;

      const mRes = await fetch(gUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: matchPrompt }] }], generationConfig: { temperature: 0.1 } })
      });

      if (mRes.ok) {
        const mData = await mRes.json();
        const matchText = mData.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
        const matchIdx = parseInt(matchText);
        if (!isNaN(matchIdx) && candidates[matchIdx]) {
          matchedIssueId = candidates[matchIdx].id;
          console.log(`[PROCESS] Found match: ${matchedIssueId}`);

          // Same-User Check
          if (user_id) {
            const { data: duplicateUserReport } = await supabase
              .from("reports")
              .select("id")
              .eq("issue_id", matchedIssueId)
              .eq("user_id", user_id)
              .maybeSingle();

            if (duplicateUserReport) {
              console.log("[PROCESS] User already reported this issue. Blocking.");
              await supabase.from("reports").delete().eq("id", reportId!);
              return new Response(JSON.stringify({ 
                success: false, 
                status: "duplicate_user", 
                error: "You have already reported this issue." 
              }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
          }
        }
      }
    }

    // 3. Issue and Report Update
    let finalIssueId = matchedIssueId;
    let status = matchedIssueId ? "matched" : "new";

    if (!finalIssueId) {
      console.log("[PROCESS] Creating new master issue.");
      const score = (aiData.severity * 0.35) + (aiData.urgency * 0.35) + (aiData.public_impact * 0.2) + (Math.log10(1 + 1) * 0.1);
      const { data: newIssue, error: iErr } = await supabase.from("issues").insert({
        title: inputTitle || aiData.ai_summary.substring(0, 50),
        category: aiData.category,
        severity: aiData.severity,
        urgency: aiData.urgency,
        public_impact: aiData.public_impact,
        priority_score: score,
        report_count: 1,
        unique_user_count: 1,
        latitude: latitude,
        longitude: longitude,
        location_label: location_label,
        ai_summary: aiData.ai_summary,
        status: "pending",
        image_url: image_url,
        department_id: DEPT_MAPPING[aiData.category] || DEPT_MAPPING["Roads"],
        visual_description: aiData.visual_description
      }).select().single();
      
      if (iErr) throw iErr;
      finalIssueId = newIssue.id;
    } else {
      console.log("[PROCESS] Merging into existing issue.");
      const { data: issue } = await supabase.from("issues").select("*").eq("id", finalIssueId).single();
      const newUniqueCount = (issue.unique_user_count || 1) + 1;
      const score = (issue.severity * 0.35) + (issue.urgency * 0.35) + (issue.public_impact * 0.2) + (Math.log10(newUniqueCount + 1) * 0.1);
      
      await supabase.from("issues").update({
        report_count: (issue.report_count || 0) + 1,
        unique_user_count: newUniqueCount,
        priority_score: score,
        last_report_at: new Date().toISOString()
      }).eq("id", finalIssueId);
    }

    // Finalize the report
    console.log(`[PROCESS] Completing report record ${reportId}...`);
    const { error: finalUpdErr } = await supabase.from("reports").update({
      issue_id: finalIssueId,
      analysis_status: "completed",
      title: inputTitle || aiData.ai_summary?.substring(0, 50) || "Civic Report"
    }).eq("id", reportId!);

    if (finalUpdErr) console.error("[DB ERROR] Final update failed:", finalUpdErr);

    return new Response(JSON.stringify({ 
      success: true, 
      status, 
      data: { ...aiData, issue_id: finalIssueId, report_id: reportId, summary: aiData.ai_summary } 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    console.error(`[CRITICAL ERROR] ${e.message}`);
    if (reportId) {
      await supabase.from("reports").update({
        analysis_status: "failed",
        error_message: e.message
      }).eq("id", reportId);
      console.log(`[DB] Updated report ${reportId} to failed status.`);
    }
    
    return new Response(JSON.stringify({ success: false, error: e.message, status: "error" }), { 
      status: 200, // Return 200 so frontend can handle custom error state
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});



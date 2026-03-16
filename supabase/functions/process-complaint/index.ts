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
  "Roads & Bridges": "bae5e6d4-5ed6-4e6e-bca2-fe7993a5ac25",
  "Sanitation & Sewage": "90ddb06c-c3a4-4599-baac-2c4508fd02c0",
  "Water Supply": "a5af057b-14cc-4ddd-aa89-d0b4efd409ed",
  "Public Safety": "5e00a1a3-8e28-49f3-b5aa-e2beb353919e",
  "Electricity": "bd3cb324-3bbb-4a08-8a9c-f2b602f85480",
  "Others": "ee1f6eff-b806-4802-8643-bfc28267dcd4"
};

function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

Deno.serve(async (req: Request) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  async function logToDB(level: string, message: string, payload: any = {}) {
    console.log(`[${level}] ${message}`, JSON.stringify(payload));
    try {
      await supabase.from("debug_logs").insert({ level, message, payload });
    } catch (e: any) {
      console.error("Failed to log to DB:", e.message);
    }
  }

  await logToDB("INFO", "Function started", { method: req.method, url: req.url });
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    await logToDB("DEBUG", "Received Payload", { keys: Object.keys(payload), hasImage: !!payload.image_url });
    
    let { 
      user_id, 
      description, 
      image_url, 
      latitude, 
      longitude, 
      location_label 
    } = payload;

    if (!latitude || !longitude || !location_label) {
      await logToDB("ERROR", "Missing location data", payload);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Location is mandatory. Please provide a valid location.",
        status: "missing_location"
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }

    const parts: any[] = [{ text: `Act as a senior civic engineer and security analyst. 
    Analyze this civic complaint description and image (if provided).
    Return ONLY raw JSON with: is_fake, rejection_reason, category, severity(1-5), urgency(1-5), public_impact(1-5), ai_summary, resolution_prediction, visual_description.
    Description: ${description || "No description provided."}` }];

    if (image_url) {
      const { data } = supabase.storage.from("complaint-images").getPublicUrl(image_url);
      const publicUrl = data?.publicUrl;
      if (publicUrl) {
        const imgRes = await fetch(publicUrl);
        if (imgRes.ok) {
          const buf = await imgRes.arrayBuffer();
          const base64 = uint8ArrayToBase64(new Uint8Array(buf));
          parts.push({ 
            inline_data: { 
              mime_type: imgRes.headers.get("Content-Type") || "image/jpeg", 
              data: base64 
            } 
          });
          await logToDB("DEBUG", "Image attached", { mime_type: imgRes.headers.get("Content-Type") });
        }
      }
    }

    const modelName = "gemini-2.5-flash";
    const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
    
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

    if (!gRes.ok) {
      const errText = await gRes.text();
      await logToDB("ERROR", "Gemini API Failure", { status: gRes.status, body: errText });
      throw new Error(`Gemini Error: ${errText}`);
    }
    
    const gData = await gRes.json();
    const aiText = gData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) throw new Error("No text content from Gemini");

    let aiData = JSON.parse(aiText.replace(/```json\n?/, "").replace(/\n?```/, "").trim());
    await logToDB("INFO", "AI Analysis Complete", { category: aiData.category, is_fake: aiData.is_fake });

    if (aiData.is_fake) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: aiData.rejection_reason || "Report rejected as invalid.", 
        status: "rejected" 
      }), { headers: corsHeaders });
    }

    // Duplicate Detection
    const { data: candidates, error: rpcError } = await supabase.rpc('get_nearby_issues', {
      lat: latitude,
      lng: longitude,
      radius_meters: 100,
      target_category: aiData.category
    });

    let matchedIssueId = candidates?.[0]?.id || null;
    let status = matchedIssueId ? "matched" : "new";
    await logToDB("DEBUG", "Duplicate detection result", { status, matchedIssueId });

    // NEW: Check if this SPECIFIC user has already reported this SPECIFIC issue
    if (matchedIssueId && user_id) {
      const { data: existingUserReport, error: checkError } = await supabase
        .from("reports")
        .select("id")
        .eq("issue_id", matchedIssueId)
        .eq("user_id", user_id)
        .maybeSingle();

      if (existingUserReport) {
        await logToDB("INFO", "Duplicate user report blocked", { user_id, matchedIssueId });
        return new Response(JSON.stringify({ 
          success: false, 
          error: "You have already submitted a report for this issue. Check 'My Complaints' to track its status.", 
          status: "duplicate_user" 
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const calculateScore = (sev: number, urg: number, imp: number, count: number) => {
      return (sev * 0.4) + (urg * 0.4) + (imp * 0.2) + (Math.log10(count) * 0.5);
    };

    let finalIssueId = matchedIssueId;
    if (!finalIssueId) {
      const deptId = DEPT_MAPPING[aiData.category] || DEPT_MAPPING["Others"];
      const initialScore = calculateScore(aiData.severity || 1, aiData.urgency || 1, aiData.public_impact || 1, 1);
      
      const { data: newIssue, error: iErr } = await supabase.from("issues").insert({
        title: aiData.ai_summary?.substring(0, 50),
        category: aiData.category,
        severity: aiData.severity,
        urgency: aiData.urgency,
        public_impact: aiData.public_impact,
        priority_score: initialScore,
        latitude,
        longitude,
        location_label,
        ai_summary: aiData.ai_summary,
        visual_description: aiData.visual_description,
        department_id: deptId,
        image_url
      }).select().single();
      
      if (iErr) throw iErr;
      finalIssueId = newIssue.id;
    } else {
      // We don't need to manually update report_count here because the trigger tr_recalculate_issue_metrics
      // on the 'reports' table will automatically update the linked issue when the new report is inserted.
      // We just need the finalIssueId to link the report.
      await logToDB("DEBUG", "Linking to existing issue", { finalIssueId });
    }

    const { data: report, error: rErr } = await supabase.from("reports").insert({
      title: aiData.ai_summary?.substring(0, 50),
      description,
      image_url,
      user_id,
      issue_id: finalIssueId,
      latitude,
      longitude,
      location_label,
      analysis_status: "completed"
    }).select().single();

    if (rErr) throw rErr;

    await logToDB("INFO", "Success", { report_id: report.id, status });
    return new Response(JSON.stringify({ 
      success: true, 
      status,
      data: { ...aiData, report_id: report.id, issue_id: finalIssueId, summary: aiData.ai_summary } 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    await logToDB("FATAL", e.message, { stack: e.stack });
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

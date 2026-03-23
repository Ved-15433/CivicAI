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

const ALLOWED_CATEGORIES = Object.keys(DEPT_MAPPING);

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

  // STAGE 1: Request Received
  await logToDB("INFO", "STAGE 1: Request received", { method: req.method, url: req.url });
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // STAGE 2: Auth Check
    const authHeader = req.headers.get('Authorization');
    await logToDB("DEBUG", "STAGE 2: Auth header check", { hasAuth: !!authHeader });

    // STAGE 3: Payload Validation
    const payload = await req.json();
    await logToDB("DEBUG", "STAGE 3: Payload validation", { keys: Object.keys(payload), hasImage: !!payload.image_url });
    
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
      await logToDB("FATAL", "GEMINI_API_KEY is missing from environment");
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }

    // STAGE 4: Image Handling
    await logToDB("DEBUG", "STAGE 4: Image handling started");
    const parts: any[] = [{ text: `Act as a senior civic engineer and security analyst. 
    Analyze this civic complaint description and image (if provided).
    Return ONLY raw JSON with: is_fake, rejection_reason, category, severity(1-5), urgency(1-5), public_impact(1-5), ai_summary, resolution_prediction, visual_description.
    - visual_description: Provide a highly detailed technical description of the object/issue in the image (e.g., "Circular pothole approximately 2 feet wide on asphalt surface near a storm drain").
    - category: Choose ONLY from: [${ALLOWED_CATEGORIES.join(", ")}].
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
          await logToDB("DEBUG", "Image data prepared for Gemini", { size: buf.byteLength });
        } else {
          await logToDB("WARNING", "Failed to fetch image for Gemini", { status: imgRes.status });
        }
      }
    }
    await logToDB("DEBUG", "STAGE 4: Image handling complete");

    // STAGE 5: Initial Gemini Analysis Started
    const modelName = "gemini-1.5-flash"; // Fixed to stable model
    const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
    
    await logToDB("INFO", "STAGE 5: Initial Gemini analysis started", { model: modelName });
    
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
      await logToDB("ERROR", "Gemini API Failure (Initial Analysis)", { status: gRes.status, body: errText });
      throw new Error(`Gemini Analysis Error (${gRes.status}): ${errText}`);
    }
    
    // STAGE 6: Initial Gemini Response Received
    const gData = await gRes.json();
    const aiText = gData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) {
      await logToDB("ERROR", "STAGE 6: No text content from Gemini", { gData });
      throw new Error("Gemini returned empty response content.");
    }

    let aiData;
    try {
      aiData = JSON.parse(aiText.replace(/```json\n?/, "").replace(/\n?```/, "").trim());
    } catch (parseErr: any) {
      await logToDB("ERROR", "STAGE 6: JSON Parse failure", { text: aiText, error: parseErr.message });
      throw new Error("Failed to parse AI response. AI returned malformed data.");
    }
    await logToDB("INFO", "STAGE 6: Initial Gemini analysis complete", { category: aiData.category });

    if (aiData.is_fake) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: aiData.rejection_reason || "Report rejected as invalid.", 
        status: "rejected" 
      }), { headers: corsHeaders });
    }

    // STAGE 7: Nearby User Reports RPC Started
    await logToDB("INFO", "STAGE 7: Nearby user reports RPC started", { user_id, latitude, longitude });
    const { data: nearbyReports, error: nrError } = await supabase.rpc('get_nearby_user_reports', {
      p_user_id: user_id,
      lat: latitude,
      lng: longitude,
      radius_meters: 100
    });

    if (nrError) {
      await logToDB("ERROR", "STAGE 7: RPC get_nearby_user_reports failed", { error: nrError });
    }

    // STAGE 8: Nearby User Reports RPC Completed
    const candidatesCount = nearbyReports?.length || 0;
    await logToDB("INFO", "STAGE 8: Nearby user reports RPC completed", { count: candidatesCount });

    if (!nrError && nearbyReports && nearbyReports.length > 0) {
      // STAGE 9: Duplicate Comparison Gemini Started
      await logToDB("INFO", "STAGE 9: Duplicate comparison Gemini request started");

      const comparisonPrompt = `Identify if the following two civic complaint reports refer to the EXACT SAME issue at the SAME spot (same-user duplicate).
      
      NEW REPORT:
      - Visual Analysis: "${aiData.visual_description}"
      - User Description: "${description}"
      - Location: "${location_label}"
      
      EXISTING REPORTS:
      ${nearbyReports.map((r: any, i: number) => `[${i}] Location: "${r.location_label || 'Unknown'}", Visual: "${r.visual_description || 'N/A'}", Text: "${r.description || 'N/A'}"`).join('\n')}
      
      MATCHING CRITERIA:
      1. If both have images, they must show the same object (rely on Visual Analysis).
      2. If one or both lack images, rely heavily on the User Description and Location.
      3. It must be the same physical problem (e.g., same pothole, not just TWO different potholes in the same neighborhood).
      
      Return ONLY a JSON object: {"is_duplicate": boolean, "matched_index": number | null, "reason": string}.`;

      const cRes = await fetch(gUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: comparisonPrompt }] }], 
          generationConfig: { 
            responseMimeType: "application/json", 
            temperature: 0 
          } 
        } )
      });

      if (cRes.ok) {
        const cData = await cRes.json();
        const cText = cData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (cText) {
          try {
            // STAGE 10: Duplicate Comparison Result Parsed
            const comparison = JSON.parse(cText.replace(/```json\n?/, "").replace(/\n?```/, "").trim());
            await logToDB("DEBUG", "STAGE 10: Duplicate comparison result parsed", comparison);

            if (comparison.is_duplicate && comparison.matched_index !== null && nearbyReports[comparison.matched_index]) {
              const matched = nearbyReports[comparison.matched_index];
              await logToDB("INFO", "Same-user duplicate blocked successfully", { 
                user_id, 
                reason: comparison.reason, 
                matched_report_id: matched.id 
              });
              return new Response(JSON.stringify({ 
                success: false, 
                message: "Complaint already submitted.", 
                error: "Complaint already submitted.", 
                status: "duplicate",
                existingReportId: matched.id,
                created_at: matched.created_at
              }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
          } catch (compParseErr: any) {
            await logToDB("ERROR", "STAGE 10: Duplicate comparison parse failed", { text: cText, error: compParseErr.message });
          }
        }
      } else {
        const cErrText = await cRes.text();
        await logToDB("ERROR", "STAGE 9: Duplicate Comparison Gemini Failure", { status: cRes.status, body: cErrText });
      }
    }

    // STAGE 11: Report Insert Started
    await logToDB("INFO", "STAGE 11: Database insertion started");
    
    const { data: candidates, error: clusterError } = await supabase.rpc('get_nearby_issues', {
      lat: latitude,
      lng: longitude,
      radius_meters: 100,
      target_category: aiData.category
    });

    if (clusterError) {
      await logToDB("ERROR", "Clustering candidates check failed", { error: clusterError });
    }

    let matchedIssueId = candidates?.[0]?.id || null;
    let finalIssueId = matchedIssueId;

    if (!finalIssueId) {
      const deptId = DEPT_MAPPING[aiData.category] || DEPT_MAPPING["Others"];
      const score = (aiData.severity * 0.4) + (aiData.urgency * 0.4) + (aiData.public_impact * 0.2);
      
      const { data: newIssue, error: iErr } = await supabase.from("issues").insert({
        title: aiData.ai_summary?.substring(0, 50),
        category: aiData.category,
        severity: aiData.severity,
        urgency: aiData.urgency,
        public_impact: aiData.public_impact,
        priority_score: score,
        latitude,
        longitude,
        location_label,
        ai_summary: aiData.ai_summary,
        visual_description: aiData.visual_description,
        department_id: deptId,
        image_url,
        status: 'Pending' // Explicitly set to 'Pending' (capitalized) to match DB constraint
      }).select().single();
      
      if (iErr) {
        await logToDB("ERROR", "STAGE 11: Issue insertion failed", { error: iErr });
        throw new Error(`Database error creating issue: ${iErr.message}`);
      }
      finalIssueId = newIssue.id;
    }

    // STAGE 12: Report Insert Completed
    const { data: report, error: rErr } = await supabase.from("reports").insert({
      title: aiData.ai_summary?.substring(0, 50),
      description,
      image_url,
      user_id,
      issue_id: finalIssueId,
      latitude,
      longitude,
      location_label,
      visual_description: aiData.visual_description,
      analysis_status: "completed"
    }).select().single();

    if (rErr) {
      await logToDB("ERROR", "STAGE 12: Report insertion failed", { error: rErr });
      throw new Error(`Database error creating report: ${rErr.message}`);
    }
    await logToDB("INFO", "STAGE 12: Report insertion successful", { report_id: report.id });

    // STAGE 13: Clustering/Metrics Update
    await logToDB("INFO", "STAGE 13: Metrics update (automated via triggers)");

    // STAGE 14: Final Response Returned
    await logToDB("INFO", "STAGE 14: Final success response returned");
    return new Response(JSON.stringify({ 
      success: true, 
      status: matchedIssueId ? "matched" : "new",
      data: { ...aiData, report_id: report.id, issue_id: finalIssueId, summary: aiData.ai_summary } 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    await logToDB("FATAL", `FAILURE in stage logic: ${e.message}`, { stack: e.stack });
    return new Response(JSON.stringify({ 
      success: false, 
      error: e.message, 
      details: e.stack,
      stage: "unknown_at_catch"
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

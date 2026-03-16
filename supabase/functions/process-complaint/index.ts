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

    // Sanitize user_id (common bug where "undefined" string is passed)
    if (user_id === "undefined" || !user_id) user_id = null;

    console.log(`[PROCESS] New report request from user: ${user_id || 'anonymous'}`);

    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY environment variable is not set.");

    // 1. Initial AI Analysis & Visual Fingerprinting
    // We do this BEFORE insertion so we can check for duplicates
    const analysisPrompt = `Act as a senior civic engineer. Analyze this complaint image and description.
    Category: Select from Roads, Sanitation, Water, Safety, Electricity, Parks.
    Stats: Provide 1-5 scores for severity, urgency, and public_impact.
    AI Summary: 1-sentence overview.
    Resolution Prediction: Estimated time to fix.
    Visual Description: Provide a DETAILED visual fingerprint of the specific problem. Focus on unique identifiers (e.g., "Circular pothole about 2ft wide next to a blue storm drain cover", "Large pile of construction debris blocking exactly 40% of the sidewalk near a green fence"). 

    Description: ${description || "No description provided."}

    Return ONLY raw JSON:
    { "category": string, "severity": number, "urgency": number, "public_impact": number, "ai_summary": string, "resolution_prediction": string, "visual_description": string }`;

    const parts = [{ text: analysisPrompt }];
    if (image_url) {
      try {
        console.log(`[PROCESS] Fetching image from storage: ${image_url}`);
        const { data } = supabase.storage.from("complaint-images").getPublicUrl(image_url);
        const publicUrl = data?.publicUrl;
        
        if (publicUrl) {
          const imgRes = await fetch(publicUrl);
          if (imgRes.ok) {
            const buf = await imgRes.arrayBuffer();
            const base64 = uint8ArrayToBase64(new Uint8Array(buf));
            parts.push({ inline_data: { mime_type: imgRes.headers.get("Content-Type") || "image/jpeg", data: base64 } } as any);
            console.log(`[PROCESS] Image attached successfully. Size: ${buf.byteLength} bytes`);
          } else {
            console.warn(`[PROCESS] Image fetch failed with status: ${imgRes.status}`);
          }
        }
      } catch (imgErr: any) {
        console.error(`[PROCESS] Non-fatal image error: ${imgErr.message}`);
      }
    }

    const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const gRes = await fetch(gUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { response_mime_type: "application/json", temperature: 0.1 } })
    });

    if (!gRes.ok) throw new Error(`Gemini API Error (${gRes.status}): ${await gRes.text()}`);
    const gData = await gRes.json();
    
    if (!gData.candidates || gData.candidates.length === 0) {
      console.error("[GEMINI ERROR] No candidates returned. Full response:", JSON.stringify(gData));
      throw new Error("AI provider failed to generate a response. Please try again.");
    }

    const aiText = gData.candidates[0].content.parts[0].text;
    console.log(`[PROCESS] Gemini response received. Length: ${aiText.length}`);

    let aiData;
    try {
      aiData = JSON.parse(aiText.replace(/```json\n?/, "").replace(/\n?```/, "").trim());
    } catch (parseErr) {
      console.error("[JSON ERROR] Failed to parse Gemini response:", aiText);
      throw new Error("AI analysis returned invalid data format.");
    }

    // Ensure numeric values
    aiData.severity = Number(aiData.severity) || 3;
    aiData.urgency = Number(aiData.urgency) || 3;
    aiData.public_impact = Number(aiData.public_impact) || 3;

    // 2. Duplicate Detection via Spatial + Visual Similarity
    console.log(`[PROCESS] Searching for nearby issues. Category: ${aiData.category}, Lat: ${latitude}, Lng: ${longitude}`);
    const { data: candidates, error: rpcErr } = await supabase.rpc('get_nearby_issues', {
      lat: latitude,
      lng: longitude,
      radius_meters: 100,
      target_category: aiData.category
    });

    if (rpcErr) {
      console.error("[DB ERROR] RPC get_nearby_issues failed:", rpcErr);
      // We don't throw here to allow report creation even if clustering fails, 
      // but we log it. Actually, for robust clustering, we should probably know if it failed.
    }

    let matchedIssueId = null;

    if (candidates && candidates.length > 0) {
      console.log(`[PROCESS] Found ${candidates.length} nearby candidates. Prompting Gemini for match...`);
      
      const matchPrompt = `Compare this new report with existing issues in the same area. 
      New Report Visual Description: ${aiData.visual_description || "No visual description provided."}
      New Report Text: ${description || "No description provided."}

      Existing Issues:
      ${candidates.map((c: any, idx: number) => `${idx}. ${c.visual_description || "No description"}`).join('\n')}

      Is it the SAME EXACT physical problem? Return ONLY the index number (0, 1, etc.) or "none" if no match.`;

      const mRes = await fetch(gUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: matchPrompt }] }], generationConfig: { temperature: 0.1 } })
      });

      if (mRes.ok) {
        const mData = await mRes.json();
        console.log(`[PROCESS] Match Gemini response: ${JSON.stringify(mData).substring(0, 100)}`);
        
        if (mData.candidates && mData.candidates.length > 0 && mData.candidates[0].content) {
          const matchText = mData.candidates[0].content.parts[0].text.trim().toLowerCase();
          const matchIdx = parseInt(matchText);
          
          if (!isNaN(matchIdx) && candidates[matchIdx]) {
            matchedIssueId = candidates[matchIdx].id;
            console.log(`[PROCESS] Matched existing issue: ${matchedIssueId}`);
            
            // 3. Same-User Check (BEFORE INSERTION)
            if (user_id) {
              console.log(`[PROCESS] Checking if user ${user_id} already reported issue ${matchedIssueId}`);
              const { data: existingUserReport, error: userReportErr } = await supabase
                .from("reports")
                .select("id, created_at")
                .eq("issue_id", matchedIssueId)
                .eq("user_id", user_id)
                .maybeSingle(); // maybeSingle is safer here than limit(1).order() for simple check

              if (userReportErr) {
                console.error("[DB ERROR] Same-user check failed:", userReportErr);
              }

              if (existingUserReport) {
                console.log(`[PROCESS] Duplicate detected for user ${user_id}. Blocking insertion.`);
                const date = new Date(existingUserReport.created_at).toLocaleDateString();
                return new Response(JSON.stringify({ 
                  success: false, 
                  status: "duplicate_user", 
                  error: `Complaint already submitted. You already reported this issue on ${date}.`,
                  existing_report_id: existingUserReport.id
                }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
              }
            }
          } else {
            console.log(`[PROCESS] No visual match found according to Gemini (returned: ${matchText})`);
          }
        }
      } else {
        console.error(`[AI ERROR] Match Gemini call failed with status ${mRes.status}`);
      }
    } else {
      console.log(`[PROCESS] No candidates found within radius.`);
    }

    // 4. Create or Update Issue
    console.log(`[PROCESS] Proceeding with issue stage. Matched issue ID: ${matchedIssueId}`);
    
    // Sanitize matchedIssueId
    if (matchedIssueId === "undefined") matchedIssueId = null;
    
    let finalIssueId = matchedIssueId;
    let duplicateStatus = matchedIssueId ? "matched" : "new";

    if (!finalIssueId) {
      const score = (aiData.severity * 0.35) + (aiData.urgency * 0.35) + (aiData.public_impact * 0.2) + (Math.log10(1 + 1) * 0.1);
      const { data: newIssue, error: iErr } = await supabase.from("issues").insert({
        title: inputTitle || aiData.ai_summary.substring(0, 50),
        category: aiData.category,
        severity: aiData.severity,
        urgency: aiData.urgency,
        public_impact: aiData.public_impact,
        priority_score: score,
        report_count: 1,
        latitude: latitude,
        longitude: longitude,
        location_label: location_label,
        ai_summary: aiData.ai_summary,
        status: "pending",
        image_url: image_url,
        department_id: DEPT_MAPPING[aiData.category] || DEPT_MAPPING[Object.keys(DEPT_MAPPING).find(k => aiData.category?.includes(k)) || "Roads"],
        visual_description: aiData.visual_description
      }).select().single();
      
      if (iErr) {
        console.error("[DB ERROR] Issue creation failed:", iErr);
        throw new Error(`Failed to create issue: ${iErr.message}`);
      }
      finalIssueId = newIssue.id;
      console.log(`[PROCESS] Created new issue: ${finalIssueId}`);
    } else {
      // Update existing issue
      console.log(`[PROCESS] Updating existing issue: ${finalIssueId}`);
      const { data: issue, error: issueFetchErr } = await supabase.from("issues").select("*").eq("id", finalIssueId).single();
      
      if (issueFetchErr || !issue) {
        console.error("[DB ERROR] Issue fetch failed for update:", issueFetchErr);
        throw new Error("Target issue not found for update.");
      }

      const newCount = (issue.report_count || 0) + 1;
      const score = (issue.severity * 0.35) + (issue.urgency * 0.35) + (issue.public_impact * 0.2) + (Math.log10(newCount + 1) * 0.1);
      
      const { error: issueUpdateErr } = await supabase.from("issues").update({
        report_count: newCount,
        priority_score: score,
        last_report_at: new Date().toISOString()
      }).eq("id", finalIssueId);

      if (issueUpdateErr) {
        console.error("[DB ERROR] Issue update failed:", issueUpdateErr);
        throw new Error(`Failed to update issue: ${issueUpdateErr.message}`);
      }
    }

    // 5. Final Insertion of Report
    console.log(`[PROCESS] Inserting report for issue: ${finalIssueId}`);
    const { data: finalReport, error: reportErr } = await supabase.from("reports").insert({
      title: inputTitle || aiData.ai_summary?.substring(0, 50) || "Civic Report",
      description: description || "No description provided",
      image_url: image_url,
      user_id: user_id,
      issue_id: finalIssueId,
      latitude: latitude,
      longitude: longitude,
      location_label: location_label,
      analysis_status: "completed"
    }).select().single();

    if (reportErr) throw reportErr;

    return new Response(JSON.stringify({ 
      success: true, 
      status: duplicateStatus, 
      data: { 
        ...aiData, 
        issue_id: finalIssueId, 
        report_id: finalReport.id,
        summary: aiData.ai_summary // ensure summary is returned as frontend expects
      } 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    const errorStack = e instanceof Error ? e.stack : "No stack trace";
    console.error(`[CRITICAL ERROR]: ${e.message}\nStack: ${errorStack}`);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: e.message,
      status: "error",
      details: errorStack 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});



import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const { clinic_id, clinic_name, clinic_phone, clinic_email, service, name, phone, email, preferred_date, message } = body;

    if (!name || !phone || !email || !service || !clinic_name) {
      return new Response(
        JSON.stringify({ error: "Champs requis manquants" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase.from("appointments").insert({
      clinic_id,
      clinic_name,
      service,
      name,
      phone,
      email,
      preferred_date: preferred_date || null,
      message: message || null,
    });

    if (dbError) {
      console.error("DB insert error:", dbError.message);
    }

    const { data: secretData } = await supabase
      .from("app_secrets")
      .select("value")
      .eq("key", "RESEND_API_KEY")
      .maybeSingle();
    const resendApiKey = secretData?.value;

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#b8860b;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">Nouvelle réservation — Vivadent</h1>
        </div>
        <div style="background:#f9f9f9;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0;">
          <table style="width:100%;border-collapse:collapse;font-size:15px;">
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;width:160px;">Service choisi :</td><td style="padding:8px 0;color:#555;">${service}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Succursale :</td><td style="padding:8px 0;color:#555;">${clinic_name}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Téléphone succursale :</td><td style="padding:8px 0;color:#555;">${clinic_phone || "—"}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Courriel succursale :</td><td style="padding:8px 0;color:#555;">${clinic_email || "—"}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Nom du patient :</td><td style="padding:8px 0;color:#555;">${name}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Téléphone :</td><td style="padding:8px 0;color:#555;">${phone}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Courriel :</td><td style="padding:8px 0;color:#555;">${email}</td></tr>
            ${preferred_date ? `<tr><td style="padding:8px 0;font-weight:bold;color:#333;">Date préférée :</td><td style="padding:8px 0;color:#555;">${preferred_date}</td></tr>` : ""}
            ${message ? `<tr><td style="padding:8px 0;font-weight:bold;color:#333;vertical-align:top;">Message :</td><td style="padding:8px 0;color:#555;">${message}</td></tr>` : ""}
          </table>
          <p style="margin-top:24px;color:#999;font-size:13px;">Réservation soumise depuis le site vivadent</p>
        </div>
      </div>
    `;

    const emailText = `Nouvelle réservation — Vivadent\n\nService choisi : ${service}\nSuccursale : ${clinic_name}\nTéléphone succursale : ${clinic_phone || "—"}\nCourriel succursale : ${clinic_email || "—"}\n\nNom du patient : ${name}\nTéléphone : ${phone}\nCourriel : ${email}\n${preferred_date ? `Date préférée : ${preferred_date}\n` : ""}${message ? `Message : ${message}\n` : ""}`;

    let emailSent = false;
    let emailError = null;

    if (resendApiKey) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Vivadent <vivadent@reactool.ai>",
            to: ["marketing@vivadent.ca"],
            subject: "Nouvelle réservation",
            html: emailHtml,
            text: emailText,
          }),
        });

        if (!resendRes.ok) {
          const errBody = await resendRes.text();
          emailError = `Resend API error: ${resendRes.status} ${errBody}`;
          console.error(emailError);
        } else {
          emailSent = true;
        }
      } catch (err) {
        emailError = `Resend fetch error: ${err.message}`;
        console.error(emailError);
      }
    } else {
      emailError = "RESEND_API_KEY not configured";
      console.error(emailError);
    }

    return new Response(
      JSON.stringify({ success: true, emailSent, emailError }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

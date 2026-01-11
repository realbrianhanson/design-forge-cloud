import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'verification' | 'unsubscribe_confirm';
  email: string;
  token: string;
  baseUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, token, baseUrl }: EmailRequest = await req.json();

    if (!email || !token || !baseUrl) {
      throw new Error('Missing required fields');
    }

    let subject: string;
    let html: string;

    if (type === 'verification') {
      const verifyUrl = `${baseUrl}/newsletter/verify?token=${token}`;
      subject = 'Confirm your 904News subscription';
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #0f766e; font-size: 28px; margin: 0;">904NEWS</h1>
                <p style="color: #64748b; margin-top: 8px;">Jacksonville's Community News</p>
              </div>
              
              <h2 style="color: #1e293b; font-size: 24px; text-align: center; margin-bottom: 16px;">
                Confirm Your Subscription
              </h2>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
                Thanks for signing up for 904News! Click the button below to confirm your email and start receiving Jacksonville's top stories.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verifyUrl}" style="display: inline-block; background: #0f766e; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Confirm Subscription
                </a>
              </div>
              
              <p style="color: #94a3b8; font-size: 14px; text-align: center;">
                If you didn't sign up for 904News, you can safely ignore this email.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
              
              <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                If the button doesn't work, copy and paste this link:<br>
                <a href="${verifyUrl}" style="color: #0f766e; word-break: break-all;">${verifyUrl}</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = 'You have been unsubscribed from 904News';
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #0f766e; font-size: 28px; margin: 0;">904NEWS</h1>
              </div>
              
              <h2 style="color: #1e293b; font-size: 24px; text-align: center; margin-bottom: 16px;">
                We're Sorry to See You Go
              </h2>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
                You have been successfully unsubscribed from 904News emails. You won't receive any more newsletters from us.
              </p>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center; margin-top: 24px;">
                Changed your mind? You can always <a href="${baseUrl}/newsletter" style="color: #0f766e;">resubscribe</a> anytime.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "904News <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

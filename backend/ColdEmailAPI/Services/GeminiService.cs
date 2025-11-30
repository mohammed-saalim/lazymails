using System.Text;
using System.Text.Json;
using ColdEmailAPI.Models;

namespace ColdEmailAPI.Services;

/// <summary>
/// Service for interacting with Google Gemini API to generate cold emails
/// </summary>
public class GeminiService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private const string GeminiApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    public GeminiService(IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _httpClient = httpClientFactory.CreateClient();
    }

    /// <summary>
    /// Generates a personalized cold email based on LinkedIn profile data, sender's profile, and email type
    /// </summary>
    /// <param name="linkedInProfileData">The extracted LinkedIn profile data of recipient</param>
    /// <param name="userProfile">The sender's profile (optional)</param>
    /// <param name="emailType">The type of email to generate</param>
    /// <param name="customPrompt">Custom prompt for EmailType.Custom (optional)</param>
    /// <returns>The generated personalized cold email</returns>
    public async Task<string> GenerateColdEmailAsync(
        string linkedInProfileData, 
        UserProfile? userProfile = null,
        EmailType emailType = EmailType.Default,
        string? customPrompt = null)
    {
        var apiKey = _configuration["GeminiApi:ApiKey"];
        if (string.IsNullOrEmpty(apiKey) || apiKey == "YOUR_GEMINI_API_KEY_HERE")
        {
            throw new InvalidOperationException("Gemini API key is not configured");
        }

        // Build prompt based on email type
        string prompt = emailType switch
        {
            EmailType.Default => BuildDefaultPrompt(linkedInProfileData, userProfile),
            EmailType.Minimal => BuildMinimalPrompt(linkedInProfileData, userProfile),
            EmailType.AboutThem => BuildAboutThemPrompt(linkedInProfileData, userProfile),
            EmailType.Custom => BuildCustomPrompt(linkedInProfileData, userProfile, customPrompt),
            _ => BuildDefaultPrompt(linkedInProfileData, userProfile)
        };

        return await SendToGeminiAsync(prompt, apiKey);
    }

    /// <summary>
    /// Builds the default comprehensive prompt that finds connections
    /// </summary>
    private string BuildDefaultPrompt(string linkedInProfileData, UserProfile? userProfile)
    {
        if (userProfile != null && !string.IsNullOrWhiteSpace(userProfile.FullName))
        {
            return $@"You are writing a personalized cold email for LinkedIn outreach.

ABOUT THE SENDER:
- Name: {userProfile.FullName}
- Current Role: {userProfile.CurrentRole ?? "Not specified"}
- Looking for: {userProfile.TargetRoles}
- Background: {userProfile.AboutMe}

RECIPIENT'S LINKEDIN PROFILE:
{linkedInProfileData}

INSTRUCTIONS:
First, identify any genuine connections between the sender and recipient:
- Same companies (past or present)
- Similar educational background
- Overlapping skills or technologies
- Same industry or domain
- Similar career trajectory
- Shared interests or achievements

Then write an email following this structure:

1. OPENING: Greet them and mention what caught your attention about their profile. If there's a genuine connection (same school, company, skill), mention it naturally here. (2-3 sentences)

2. YOUR BACKGROUND: Briefly introduce yourself using the sender's background. Highlight any relevant overlap with the recipient. (1-2 sentences)

3. THE ASK: Mention they've already achieved what you're working towards and that a conversation would help you learn from their experience. (2 sentences)

4. CALL TO ACTION: Request a 15-minute call at their convenience.

Make it:
- Conversational and genuine (not formal or stiff)
- Specific to their actual experience from their profile
- Highlight genuine connections naturally (don't force it if none exist)
- Keep it concise (under 150 words)
- DO NOT include subject line, just the email body
- Sign off with the sender's first name ({GetFirstName(userProfile.FullName)})

Write only the email body:";
        }
        else
        {
            return $@"You are writing a personalized cold email for LinkedIn outreach. Based on the profile information below, write an email following this exact structure:

1. OPENING: Start with greeting and mention what caught your attention about their profile (2-3 sentences, be specific about their experience/achievements)

2. YOUR BACKGROUND: Briefly mention you have relevant background and are in early stage of your journey/career/project (1-2 sentences)

3. THE ASK: Mention they've already achieved what you're working towards and that having a conversation would be really helpful to learn from their decisions and experience (2 sentences)

4. CALL TO ACTION: Request a 15-minute call next week at their convenience

Make it:
- Conversational and genuine (not overly formal)
- Specific to their actual experience/role/achievements from their profile
- Show you've read their profile carefully
- Keep it concise (under 150 words total)
- DO NOT include subject line, just the email body
- Use their name if available

LinkedIn Profile Data:
{linkedInProfileData}

Write only the email body:";
        }
    }

    /// <summary>
    /// Builds a minimal, direct referral request prompt (~80 words)
    /// </summary>
    private string BuildMinimalPrompt(string linkedInProfileData, UserProfile? userProfile)
    {
        var senderName = userProfile?.FullName ?? "A professional";
        var senderCurrentRole = userProfile?.CurrentRole ?? "Software professional";
        var senderAboutMe = userProfile?.AboutMe ?? "relevant technical experience";

        return $@"You are writing a short, direct cold email requesting a job referral.

ABOUT THE SENDER:
- Name: {senderName}
- Current Role: {senderCurrentRole}
- Background/Skills: {senderAboutMe}

RECIPIENT'S LINKEDIN PROFILE:
{linkedInProfileData}

INSTRUCTIONS:
Write a very short referral request email (under 80 words):

1. One line: Mention you found a specific role at their company (extract company from their profile) and you're interested
2. One line: Briefly state your relevant experience (years + key tech/skills)
3. One line: Ask directly if they'd be open to referring you, offer to send resume
4. One line: Thank them either way
5. Sign off with sender's first name ({GetFirstName(senderName)})

Make it:
- Very concise and direct
- Respectful of their time
- No fluff or excessive flattery
- Professional but friendly

Write only the email body:";
    }

    /// <summary>
    /// Builds a prompt focused entirely on the recipient and learning from them (~120 words)
    /// </summary>
    private string BuildAboutThemPrompt(string linkedInProfileData, UserProfile? userProfile)
    {
        var senderName = userProfile?.FullName ?? "A professional";
        var senderCurrentRole = userProfile?.CurrentRole ?? "Not specified";
        var senderTargetRoles = userProfile?.TargetRoles ?? "career growth";

        return $@"You are writing a cold email focused entirely on the recipient and learning from them.

ABOUT THE SENDER:
- Name: {senderName}
- Current Role: {senderCurrentRole}
- Looking for: {senderTargetRoles}

RECIPIENT'S LINKEDIN PROFILE:
{linkedInProfileData}

INSTRUCTIONS:
Write an email that makes it ALL about them (under 120 words):

1. OPENING: Mention 2-3 specific things that impressed you about their career/achievements (be very specific from their profile)

2. GENUINE INTEREST: Express that you'd love to learn more about their journey - pick something specific like:
   - How they transitioned into their current role
   - How they developed expertise in X
   - Their experience at [specific company]
   - A decision they made in their career

3. SOFT ASK: Say you'd love to connect and hear their perspective, no pressure

4. Sign off warmly with sender's first name ({GetFirstName(senderName)})

Make it:
- Entirely focused on them, not about asking for anything
- Genuinely curious and admiring
- Specific to their actual profile (not generic)
- No mention of job hunting or referrals

Write only the email body:";
    }

    /// <summary>
    /// Builds a prompt based on user's custom instructions
    /// </summary>
    private string BuildCustomPrompt(string linkedInProfileData, UserProfile? userProfile, string? customPrompt)
    {
        var senderName = userProfile?.FullName ?? "A professional";
        var senderCurrentRole = userProfile?.CurrentRole ?? "Not specified";
        var senderAboutMe = userProfile?.AboutMe ?? "relevant background and experience";

        var userInstructions = !string.IsNullOrWhiteSpace(customPrompt) 
            ? customPrompt 
            : "Write a professional networking email.";

        return $@"You are writing a cold email based on custom instructions.

ABOUT THE SENDER:
- Name: {senderName}
- Current Role: {senderCurrentRole}
- Background: {senderAboutMe}

RECIPIENT'S LINKEDIN PROFILE:
{linkedInProfileData}

USER'S CUSTOM INSTRUCTIONS:
{userInstructions}

Based on the above information and custom instructions, write the email.
Sign off with the sender's first name ({GetFirstName(senderName)}).

Write only the email body:";
    }

    /// <summary>
    /// Sends the prompt to Gemini API and returns the generated response
    /// </summary>
    private async Task<string> SendToGeminiAsync(string prompt, string apiKey)
    {
        try
        {
            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{GeminiApiUrl}?key={apiKey}", content);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Gemini API request failed: {response.StatusCode} - {errorContent}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var jsonResponse = JsonDocument.Parse(responseContent);

            // Extract the generated text from the response
            var generatedText = jsonResponse.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return generatedText ?? "Failed to generate email";
        }
        catch (Exception ex)
        {
            throw new Exception($"Error generating email with Gemini API: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Extracts first name from full name
    /// </summary>
    private static string GetFirstName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName)) return "";
        var parts = fullName.Trim().Split(' ');
        return parts[0];
    }
}

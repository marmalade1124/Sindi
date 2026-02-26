import json
from openai import AsyncOpenAI
from app.core.config import settings
from app.models.outage import ExtractedOutageData

# Initialize the OpenAI client pointing to NVIDIA NIM
client = AsyncOpenAI(
    base_url=settings.nvidia_base_url,
    api_key=settings.nvidia_api_key
)

# We use Llama 3.1 70B Instruct for high-quality instruction following / JSON extraction
LLM_MODEL = "meta/llama-3.1-70b-instruct"

SYSTEM_PROMPT = """You are an expert AI assistant that extracts power outage information from Facebook posts of electric cooperatives in the Philippines.

Analyze the provided text and output ONLY a JSON object with these EXACT fields:

{
  "is_outage": true/false,
  "outage_type": "planned" | "emergency" | "advisory",
  "start_datetime": "YYYY-MM-DDTHH:MM:SS" or null,
  "estimated_restore_datetime": "YYYY-MM-DDTHH:MM:SS" or null,
  "affected_locations": [
    {
      "city": "City Name",
      "barangays": ["Barangay1", "Barangay2"]
    }
  ],
  "reason": "Brief reason string" or null,
  "confidence_score": 0.0 to 1.0
}

CRITICAL RULES:
1. ONLY return valid JSON. No markdown, no explanation, no code blocks.
2. If the year is missing, assume 2026.
3. For "affected_locations", group barangays by their city. Remove "Brgy." or "Barangay" prefixes, use Title Case.
4. If the post mentions specific purok/subdivision names (e.g., "Purok Popular", "Angelica Homes"), treat them as barangay-level entries.
5. If the post is NOT about an outage/brownout/interruption (e.g., a greeting, award, general announcement), set "is_outage" to false.
6. For planned outages with clear dates, extract start_datetime and estimated_restore_datetime.
7. Use 24-hour format for times. "8:00 AM" = "08:00:00", "4:00 PM" = "16:00:00".
"""


async def extract_outage_data_from_text(text: str) -> ExtractedOutageData:
    """Extracts structured outage data from plain text."""

    prompt = f"Extract power outage details from this Philippine electric cooperative Facebook post:\n\n{text}\n\nReturn ONLY the JSON object."

    try:
        response = await client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=1024,
            response_format={"type": "json_object"}
        )

        raw_json = response.choices[0].message.content
        data_dict = json.loads(raw_json)
        return ExtractedOutageData(**data_dict)

    except Exception as e:
        err_msg = str(e).encode('ascii', 'replace').decode()
        print(f"Error in AI extraction: {err_msg}")
        # Return empty/safe default
        return ExtractedOutageData(is_outage=False)

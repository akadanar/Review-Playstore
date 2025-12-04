import { getReviews } from "@/lib/reviews"

export async function chatCompletionsLlamaKolosal(
  msg: string,
  system: string = "",
  response_format: any = undefined
) {
  if (!process.env.KOLOSAL_AI_TOKEN) throw new Error("Missing KOLOSAL_API_TOKEN in .env")

  const body = {
    model: "Llama 4 Maverick",
    messages: [
      { role: "system", content: system },
      { role: "user", content: msg }
    ],
    response_format
  }

  const response = await fetch("https://api.kolosal.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.KOLOSAL_AI_TOKEN}`
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  return data.choices?.[0]?.message?.content || "";
}

export async function analyzeReviews(reviews: string[]) {
  const msg = `
Analisis kumpulan review aplikasi berikut. Review dapat berasal dari berbagai rating (1–5), berbagai versi aplikasi, dan berbagai bahasa.

    Tugasmu:

    Ringkas sentimen keseluruhan dari batch ini.
    Identifikasi poin positif utama (maksimal 7).
    Identifikasi poin negatif utama / masalah (maksimal 10).
    Berikan action items untuk developer (maksimal 10), setiap poin harus:
    - jelas
    - actionable
    - ada penjelasan singkat kenapa penting

    Format output (Wajib JSON valid):
    
    {
      "overall_sentiment": "positive|negative|mixed|neutral",
      "summary_overall": "...",
      "positive_points": [
        "..."
      ],
      "negative_points": [
        "..."
      ],
      "action_items_for_developer": [
        {
          "priority": "high|medium|low",
          "area": "stability|performance|usability|feature|other",
          "description": "...",
          "reason": "..."
        }
      ]
    }

    Berikut datanya:
    ${JSON.stringify(reviews)}
`;

  const system = `
Kamu adalah analis produk dan UX expert.
    Tugasmu adalah menganalisis kumpulan review aplikasi yang sangat banyak dan beragam.
    Fokus pada akurasi, identifikasi pola, dan memberi rekomendasi yang actionable.

    Satu-satunya output yang boleh kamu berikan adalah JSON VALID yang mengikuti skema yang diberikan.
    Jangan sertakan penjelasan, catatan, markdown, code fence, atau teks apa pun di luar JSON.

    Sebelum memberikan jawaban, lakukan validasi internal terhadap JSON untuk memastikan:
    - sintaks valid
    - koma tidak salah
    - tanda kurung buka/tutup sesuai
    - tidak ada trailing comma
    - aturan tanda kutip benar
    - tidak ada field yang tidak diizinkan

    Jika semua sudah valid, keluarkan HANYA JSON final tersebut.
`;

  const format = {
    type: "json_schema",
    json_schema: {
      name: "review_summary",
      strict: true,
      schema: {
        type: "object",
        properties: {
          overall_sentiment: {
            type: "string",
            enum: ["positive", "negative", "mixed", "neutral"]
          },
          summary_overall: {
            type: "string"
          },
          positive_points: {
            type: "array",
            items: {
              type: "string"
            }
          },
          negative_points: {
            type: "array",
            items: {
              type: "string"
            }
          },
          action_items_for_developer: {
            type: "array",
            items: {
              type: "object",
              properties: {
                priority: {
                  type: "string",
                  enum: ["high", "medium", "low"]
                },
                area: {
                  type: "string",
                  enum: ["stability", "performance", "usability", "feature", "other"]
                },
                description: {
                  type: "string"
                },
                reason: {
                  type: "string"
                }
              },
              required: ["priority", "area", "description", "reason"],
              additionalProperties: false
            }
          }
        },
        required: ["overall_sentiment", "summary_overall", "positive_points", "negative_points", "action_items_for_developer"],
        additionalProperties: false
      }
    }
  }

  const summary = await chatCompletionsLlamaKolosal(msg, system, format);

  return JSON.parse(summary);
}

export async function fetchReviewsAndAnalyze(appId: string, reviewCount: number = 100) {
  try {
    const reviews = await getReviews(appId, reviewCount)

    return await analyzeReviews(reviews)
  } catch (e) {
    console.error(e)
    throw e
  }
}

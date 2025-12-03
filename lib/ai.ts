export async function chatCompletionsLlamaKolosal(msg: string, system: string = "") {
  const response = await fetch("https://api.kolosal.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.KOLOSAL_AI_TOKEN}`
    },
    body: JSON.stringify({
      model: "Llama 4 Maverick",
      messages: [
        {
          role: "system",
          content: system
        },
        {
          role: "user",
          content: msg
        }
      ]
    })
  })

  const data = await response.json()

  return data.choices[0].message.content
}

export async function mecutAISuruhAnalisisReview(reviews: string[]) {
  const msg = `
    Analisis kumpulan review aplikasi berikut. Review dapat berasal dari berbagai rating (1–5), berbagai versi aplikasi, dan berbagai bahasa.

    Tugasmu:

    Ringkas sentimen keseluruhan dari batch ini.
    Identifikasi poin positif utama (maksimal 7).
    Identifikasi poin negatif utama / masalah (maksimal 10).
    Kelompokkan semua masalah ke dalam kategori berikut:
    - stability (crash, error, freeze)
    - performance (lambat, lag, loading)
    - usability (UI/UX, navigasi, kebingungan fitur)
    - feature_request (fitur yang diminta user)
    - content_quality (data kurang akurat, konten jelek)
    - other (hal lain yang tidak cocok kategori lain)
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
      "issues_grouped": {
        "stability": ["..."],
        "performance": ["..."],
        "usability": ["..."],
        "feature_request": ["..."],
        "content_quality": ["..."],
        "other": ["..."]
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
`
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

    Jika semua sudah valid, keluarkan HANYA JSON final tersebut.`

  const summary = await chatCompletionsLlamaKolosal(msg, system)

  const cleaned = summary
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")

  return JSON.parse(cleaned)
}

import { GoogleGenAI, Modality } from "@google/genai";

// --- ส่วนของการแชท (Chat) ---
export const getGeminiResponse = async (
    prompt: string,
    history: { role: string, parts: string }[],
    userApiKey: string
) => {
    // เช็คว่ามีกุญแจไหม ถ้าไม่มีก็จบข่าว
    if (!userApiKey) return "ใส่ API Key ก่อนสิพี่ เดี๋ยวคุยด้วย";

    const ai = new GoogleGenAI({ apiKey: userApiKey });

    try {
        // สร้างแชทใหม่โดยใช้โมเดลตัวล่าสุด (Gemini 3 Flash Preview)
        // ตัวนี้แหละที่ฉลาดและเร็วตามตัวอย่างที่พี่ต้องการ
        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                // ใส่บุคลิกให้มันหน่อย จะได้ไม่จืด
                systemInstruction: 'You are "Goo Gemnee" (กูเจมนี่), a playful, sarcastic, and teasing AI assistant. You speak Thai. You like to roast the user slightly but are still helpful. Keep responses concise.',
                temperature: 0.7, // ค่านี้ทำให้คำตอบมีความหลากหลาย ไม่แข็งทื่อ
            }
        });

        // ส่งข้อความไปหา AI
        // หมายเหตุ: โค้ดตัวอย่างใช้วิธีส่ง prompt ตรงๆ เพื่อความรวดเร็วและแม่นยำใน context ปัจจุบัน
        const response = await chat.sendMessage({ message: prompt });

        return response.text;
    } catch (error) {
        console.error("Chat Error:", error);
        return "โทษที ระบบรวนนิดหน่อย (Error) ลองถามใหม่ซิ";
    }
};

// --- ส่วนของการสร้างเสียง (TTS) ---
export const generateGooSpeech = async (text: string, userApiKey: string): Promise<string> => {
    if (!userApiKey) return "";

    const ai = new GoogleGenAI({ apiKey: userApiKey });

    try {
        const response = await ai.models.generateContent({
            // ใช้โมเดลสำหรับเสียงโดยเฉพาะ (Gemini 2.5 Flash Preview TTS)
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `พูดด้วยน้ำเสียงกวนประสาทและขี้เล่น: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: 'Puck' // เสียง Puck (ผู้ชาย) เหมาะกับคาแรคเตอร์กวนๆ
                            // ถ้าอยากได้เสียงผู้หญิงเปลี่ยนเป็น 'Kore' หรือ 'Fenrir'
                        },
                    },
                },
            },
        });

        // ดึงข้อมูลเสียง Base64 ออกมา
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || "";
    } catch (error) {
        console.error("TTS Error:", error);
        return "";
    }
};

// --- ฟังก์ชันแปลงไฟล์เสียง (Helper Functions) ---

// แปลง Base64 เป็น Binary
export function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// แปลง PCM Data เป็น AudioBuffer เพื่อให้เล่นบน Browser ได้
export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}
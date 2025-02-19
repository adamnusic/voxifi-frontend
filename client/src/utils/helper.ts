import axios from "axios";

export const getTtsAudioUrl = async (text: string, audioUrl: string) => {
  try {
    console.log('Making TTS request with:', { text, audioUrl });
    const response = await axios.post(
      `${import.meta.env.VITE_AGENT_SERVER_URL}/llasa-voice-synthesizer`,
      {
        text,
        audioUrl,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    if (!response.data?.url) {
      throw new Error('No URL returned from TTS service');
    }

    console.log('TTS response:', response.data);
    return response.data.url;
  } catch (error: any) {
    console.error('Detailed TTS error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(error.response?.data?.message || error.message);
  }
};
import axios from "axios";

const testEndpoint = async () => {
  try {
    const baseUrl = import.meta.env.VITE_AGENT_SERVER_URL.endsWith('/')
      ? import.meta.env.VITE_AGENT_SERVER_URL.slice(0, -1)
      : import.meta.env.VITE_AGENT_SERVER_URL;

    const response = await axios.get(baseUrl, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    console.error('TTS service endpoint test failed:', error);
    return false;
  }
};

export const getTtsAudioUrl = async (text: string, audioUrl: string) => {
  try {
    // Test endpoint first
    const isEndpointAvailable = await testEndpoint();
    if (!isEndpointAvailable) {
      throw new Error('TTS service is currently unavailable. Please try again later.');
    }

    // Format the base URL correctly
    const baseUrl = import.meta.env.VITE_AGENT_SERVER_URL.endsWith('/')
      ? import.meta.env.VITE_AGENT_SERVER_URL.slice(0, -1)
      : import.meta.env.VITE_AGENT_SERVER_URL;

    console.log('Making TTS request with:', { text, audioUrl });
    const response = await axios.post(
      `${baseUrl}/llasa-voice-synthesizer`,
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
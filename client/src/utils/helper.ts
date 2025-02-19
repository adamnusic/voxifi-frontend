import axios from "axios";

export const getTtsAudioUrl = async (text: string, audioUrl: string) => {
  const response = await axios.post(
    `${import.meta.env.VITE_AGENT_SERVER_URL}/llasa-voice-synthesizer`,
    {
      text,
      audioUrl,
    }
  );
  return response.data.url;
};

import BaseService from "../base.service";
interface ChatRequest {
  message: string;
  chatId:number;
}

interface UserState {
  state: {
    token: string;
  };
}

class OpenaiService extends BaseService {
  constructor() {
    super("/openai");
  }

  async chat(
    data: ChatRequest,
    onChunk: (chunk: string) => void,
    onComplete?: () => void
  ): Promise<void> {
    const state: UserState = JSON.parse(localStorage.getItem("user") || "{}");
    const token = state?.state?.token;
    const response = await fetch(this.url("/chat"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        onComplete?.();
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            onComplete?.();
            break;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              console.error("Error from server:", parsed.message);
              onComplete?.();
              return;
            }
            onChunk(parsed.content);
          } catch (error) {
            console.error("Error parsing chunk:", error);
          }
        }
      }
    }
  }
}

export default new OpenaiService();

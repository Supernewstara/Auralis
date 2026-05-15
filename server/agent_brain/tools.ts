import OpenAI from "openai";

export const toolDefinitions: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "chat_reply",
      description: "Directly chat with the user. Use this when the user is making conversation and you do not need to play or recommend any music right now.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The casual conversational reply to the user. Like a friend texting."
          }
        },
        required: ["text"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_track",
      description: "Search for a track by keyword (song name, artist, etc) to get details for recommendation.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query, e.g. 'Beatles Hey Jude'"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "play_tracks",
      description: "Submit tracks to play immediately for the user. This replaces the entire current playlist/queue.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The conversational text introducing the songs."
          },
          track_ids: {
            type: "array",
            items: { type: "number" },
            description: "An array of track IDs to play, picked from the search_track results. Never invent track IDs."
          }
        },
        required: ["text", "track_ids"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_to_queue",
      description: "Appends tracks to the end of the user's current music queue without interrupting the currently playing song.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The conversational text responding to the user."
          },
          track_ids: {
            type: "array",
            items: { type: "number" },
            description: "An array of track IDs to add to the queue."
          }
        },
        required: ["text", "track_ids"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "skip_current",
      description: "Skip the currently playing song and go to the next track in the queue.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Conversational text responding to the user." }
        },
        required: ["text"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pause_playback",
      description: "CRITICAL: You MUST use this tool to pause the current music playback whenever the user asks to 'pause', 'stop', '暂停', '停一下', etc. Do NOT use chat_reply for this.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Conversational text responding to the user." }
        },
        required: ["text"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "resume_playback",
      description: "Resume the paused music playback.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Conversational text responding to the user." }
        },
        required: ["text"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_user_memory",
      description: "Record important facts about the user's music preferences, personal context, or reactions. Call this when the user says something like '我不喜欢重金属', '其实我也挺喜欢民谣的', '今天心情不太好', etc. Always record negative feedback (dislikes, skips, complaints) proactively.",
      parameters: {
        type: "object",
        properties: {
          fact: { type: "string", description: "The specific fact to remember, e.g. '我不喜欢重金属' or 'Recently likes Taylor Swift'." },
          category: { type: "string", enum: ["genre_preference", "artist_opinion", "personal_note", "feedback"], description: "The category of the memory." }
        },
        required: ["fact", "category"]
      }
    }
  }
];


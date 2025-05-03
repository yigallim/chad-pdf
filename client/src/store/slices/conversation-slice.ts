import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/service/api";

export type PDFMeta = {
  id: string;
  filename: string;
  word_count: number;
  loading: boolean;
};

export type HistoryEntry =
  | { role: "user"; parts: { text: string }[] }
  | { role: "model"; parts: { text: string }[] };

export type BaseConversation = {
  id: string;
  label: string;
  history: HistoryEntry[];
  createdAt: number;
};

export type Conversation = BaseConversation & { pdfMeta: PDFMeta[] };

export interface ConversationState {
  items: Conversation[];
  loading: boolean;
  error: string | null;
}

const defaultItems: Conversation[] = [];

const initialState: ConversationState = {
  items: defaultItems,
  loading: true,
  error: null,
};

export const revalidateConversation = createAsyncThunk<
  Conversation[],
  void,
  { rejectValue: string }
>("conversation/revalidateConversation", async (_, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.get("/conversation");
    return data.map((item: Conversation) => ({
      id: item.id,
      label: item.label,
      createdAt: item.createdAt,
      pdfMeta: item.pdfMeta,
      history: item.history,
    }));
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || error.message || "Failed to fetch conversations"
    );
  }
});

export const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    deleteConversation: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((conv) => conv.id !== action.payload);
    },
    setConversation: (state, action: PayloadAction<Conversation[]>) => {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(revalidateConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(revalidateConversation.fulfilled, (state, action) => {
        state.items = action.payload.sort((a, b) => b.createdAt - a.createdAt);
        state.loading = false;
      })
      .addCase(revalidateConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      });
  },
});

export const { deleteConversation, setConversation } = conversationSlice.actions;
export default conversationSlice.reducer;

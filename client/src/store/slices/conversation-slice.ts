import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/service/api";

export type PDFMeta = {
  id: string;
  filename: string;
};

export type BaseConversation = {
  key: string;
  label: string;
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

export type ConversationResponse = {
  id: string;
  label: string;
  pdfMeta: PDFMeta[];
  createdAt: number;
};

export const revalidateConversation = createAsyncThunk<
  Conversation[],
  void,
  { rejectValue: string }
>("conversation/revalidateConversation", async (_, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.get("/conversation");
    return data.map((item: ConversationResponse) => ({
      key: item.id,
      label: item.label,
      createdAt: item.createdAt,
      pdfMeta: item.pdfMeta,
    }));
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || "Failed to fetch conversations"
    );
  }
});

export const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    addConversation: (state, action: PayloadAction<{ label: string }>) => {
      const newConversation: Conversation = {
        key: `${state.items.length}`,
        label: action.payload.label,
        createdAt: Date.now(),
        pdfMeta: [],
      };
      state.items.push(newConversation);
    },
    deleteConversation: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((conv) => conv.key !== action.payload);
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

export const { addConversation, deleteConversation, setConversation } = conversationSlice.actions;
export default conversationSlice.reducer;

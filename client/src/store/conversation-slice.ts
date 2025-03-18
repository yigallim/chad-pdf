import { Conversation } from "@ant-design/x/es/conversations";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ConversationState {
  items: Conversation[];
  currentConversationKey: string | undefined;
}

const defaultItems: Conversation[] = [
  {
    key: "0",
    label: "New Conversation",
  },
];

const initialState: ConversationState = {
  items: defaultItems,
  currentConversationKey: defaultItems[0].key,
};

export const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    addConversation: (state, action: PayloadAction<{ label: string }>) => {
      const newConversation: Conversation = {
        key: `${state.items.length}`,
        label: action.payload.label,
      };
      state.items.push(newConversation);
      state.currentConversationKey = newConversation.key;
    },

    deleteConversation: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((conv) => conv.key !== action.payload);

      if (state.currentConversationKey === action.payload) {
        state.currentConversationKey = state.items.length > 0 ? state.items[0].key : undefined;
      }
    },

    setCurrentConversation: (state, action: PayloadAction<string>) => {
      state.currentConversationKey = action.payload;
    },
  },
});

export const { addConversation, deleteConversation, setCurrentConversation } =
  conversationSlice.actions;
export default conversationSlice.reducer;

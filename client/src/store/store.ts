import { configureStore } from "@reduxjs/toolkit";
import conversationReducer from "./conversation-slice";

export const store = configureStore({
  reducer: {
    conversation: conversationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  addConversation,
  deleteConversation,
  setConversation,
  revalidateConversation,
  Conversation,
} from "@/store/slices/conversation-slice";
import { createSelector } from "@reduxjs/toolkit";

const selectConversationItems = createSelector(
  (state: RootState) => state.conversation.items,
  (items) => ({ items })
);

export const useConversationValue = () => {
  return useSelector(selectConversationItems);
};

export const useConversationActions = () => {
  const dispatch = useDispatch<AppDispatch>();

  return {
    addConversation: (label: string) => dispatch(addConversation({ label })),
    deleteConversation: (key: string) => dispatch(deleteConversation(key)),
    setConversation: (payload: Conversation[]) => dispatch(setConversation(payload)),
    revalidateConversation: () => dispatch(revalidateConversation()),
  };
};

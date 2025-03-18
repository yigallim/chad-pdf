import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  addConversation,
  deleteConversation,
  setCurrentConversation,
} from "@/store/conversation-slice";
import { createSelector } from "@reduxjs/toolkit";

const selectConversationState = createSelector(
  (state: RootState) => state.conversation.items,
  (state: RootState) => state.conversation.currentConversationKey,
  (items, currentConversationKey) => ({ items, currentConversationKey })
);

export const useConversationValue = () => {
  return useSelector(selectConversationState);
};

export const useConversationActions = () => {
  const dispatch = useDispatch();
  return {
    addConversation: (label: string) => dispatch(addConversation({ label })),
    deleteConversation: (key: string) => dispatch(deleteConversation(key)),
    setCurrentConversation: (key: string) => dispatch(setCurrentConversation(key)),
  };
};

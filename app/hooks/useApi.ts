import { useFetcher } from "@remix-run/react";
import { useCallback } from "react";
import toast from "react-hot-toast";

export function useSnippetActions() {
  const fetcher = useFetcher();

  const likeSnippet = useCallback((snippetId: string) => {
    fetcher.submit(
      { intent: 'like', snippetId },
      { method: 'post', action: '/api/interactions' }
    );
  }, [fetcher]);

  const bookmarkSnippet = useCallback((snippetId: string) => {
    fetcher.submit(
      { intent: 'bookmark', snippetId },
      { method: 'post', action: '/api/interactions' }
    );
  }, [fetcher]);

  const commentOnSnippet = useCallback((snippetId: string, content: string) => {
    if (!content.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    fetcher.submit(
      { intent: 'comment', snippetId, content },
      { method: 'post', action: '/api/interactions' }
    );
  }, [fetcher]);

  return {
    likeSnippet,
    bookmarkSnippet,
    commentOnSnippet,
    isLoading: fetcher.state === 'submitting'
  };
}
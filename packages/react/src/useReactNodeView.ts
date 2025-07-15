import type { ReactNode } from 'react'
import { createContext, createElement, useContext } from 'react'

export interface ReactNodeViewContextProps {
  // why?
  onDragStart?: (event: DragEvent) => void
  nodeViewContentRef?: (element: HTMLElement | null) => void
  /**
   * This allows you to add children into the NodeViewContent component.
   * This is useful when statically rendering the content of a node view.
   */
  nodeViewContentChildren?: ReactNode
}

export const ReactNodeViewContext = createContext<ReactNodeViewContextProps>({
  onDragStart: () => {
    // no-op
  },
  nodeViewContentChildren: undefined,
  nodeViewContentRef: () => {
    // no-op
  },
})

export const ReactNodeViewContentProvider = ({ children, content }: { children: ReactNode; content: ReactNode }) => {
  // why? this is what is passing the children into NodeViewContent
  return createElement(ReactNodeViewContext.Provider, { value: { nodeViewContentChildren: content } }, children)
}
// problem
export const useReactNodeView = () => useContext(ReactNodeViewContext)

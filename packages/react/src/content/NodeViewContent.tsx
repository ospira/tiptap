// 4?

import type { ComponentProps } from 'react'
import React from 'react'

// import { useReactNodeView } from './useReactNodeView.js'

export type NodeViewContentProps<T extends keyof React.JSX.IntrinsicElements = 'div'> = {
  as?: NoInfer<T>
} & ComponentProps<T>

export function NodeViewContent<T extends keyof React.JSX.IntrinsicElements = 'div'>({
  as: Tag = 'div' as T,
  ...props
}: NodeViewContentProps<T>) {
  // why
  // const { nodeViewContentRef, nodeViewContentChildren } = useReactNodeView()

  console.log('NodeViewContent', { props })
  console.trace()
  debugger
  return !props.nodeViewContentRef ? (
    <Tag
      {...props}
      data-node-view-content=""
      // className={props.className}
      style={{
        whiteSpace: 'pre-wrap',
        ...props.style,
      }}
    >
      {props.children}
      {props.content}
    </Tag>
  ) : (
    <Tag
      {...props}
      ref={props.nodeViewContentRef}
      data-node-view-content=""
      // className={props.className}
      style={{
        whiteSpace: 'pre-wrap',
        ...props.style,
      }}
    >
      {props.children}
      {props.content}
      {/* nodeViewContentChildren */}
    </Tag>
  )

  // @ts-ignore
}

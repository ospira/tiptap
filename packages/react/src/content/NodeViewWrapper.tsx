// 3?

import React from 'react'

// import { useReactNodeView } from './useReactNodeView.js'

export interface NodeViewWrapperProps {
  [key: string]: any
  as?: React.ElementType
}

export const NodeViewWrapper: React.FC<NodeViewWrapperProps> = React.forwardRef((props, ref) => {
  
  console.log("NodeViewWrapper", {props})

  // debugger;
  
  // const { onDragStart } = useReactNodeView()
  const Tag = props.as || 'div'

  return (
    // @ts-ignore
    <Tag
      {...props}
      ref={ref}
      data-node-view-wrapper=""
      // onDragStart={onDragStart}
      // className={props.className}
      style={{
        whiteSpace: 'normal',
        ...props.style,
      }}
    />
  )
})
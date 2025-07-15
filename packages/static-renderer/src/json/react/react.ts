/* eslint-disable @typescript-eslint/no-explicit-any */

import type { MarkType, NodeType } from '@tiptap/core'
import React from 'react'

import type { TiptapStaticRendererOptions } from '../renderer.js'
import { TiptapStaticRenderer } from '../renderer.js'

export function renderJSONContentToReactElement<
  /**
   * A mark type is either a JSON representation of a mark or a Prosemirror mark instance
   */
  TMarkType extends { type: any } = MarkType,
  /**
   * A node type is either a JSON representation of a node or a Prosemirror node instance
   */
  TNodeType extends {
    content?: { forEach: (cb: (node: TNodeType) => void) => void }
    marks?: readonly TMarkType[]
    type: string | { name: string }
  } = NodeType,
>(options: TiptapStaticRendererOptions<React.ReactNode, TMarkType, TNodeType>) {
  let key = 0
  console.log("this was rendererArgs in extensionRenderer", {options})
  // debugger;
  return TiptapStaticRenderer<React.ReactNode, TMarkType, TNodeType>(({ component, props: { children, ...props } }) => {
    // console.log("inner debugger")
    console.log("To wrap:", {component}) // 
    // debugger;
    return React.createElement(

      Object.entries(options.nodeMapping).find(([key, val])=>
        val === component)[0] ?? 'div',
      { key: key++ },
      React.createElement(
      component as React.FC<typeof props>,
      // eslint-disable-next-line no-plusplus
      Object.assign(props, { key: key++ }),
      ([] as React.ReactNode[]).concat(children),
    )
    )
  }, options)
}

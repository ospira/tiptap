// 5 Header is correct and then...?

import type { DecorationWithType, Editor, NodeViewRenderer, NodeViewRendererOptions, NodeViewRendererProps } from '@tiptap/core'
import { getRenderedAttributes, NodeView } from '@tiptap/core'
import type { Node, Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Decoration, DecorationSource, NodeView as ProseMirrorNodeView } from '@tiptap/pm/view'
import type { ComponentType, NamedExoticComponent } from 'react'
import { createElement, createRef, memo } from 'react'

import type { EditorWithContentComponent } from './Editor.js'
import { ReactRenderer } from './ReactRenderer.js'
import type { ReactNodeViewProps } from './types.js'
// import type { ReactNodeViewContextProps } from './useReactNodeView.js'
// import { ReactNodeViewContext } from './useReactNodeView.js'
import { Component } from 'react'

export interface ReactNodeViewRendererOptions extends NodeViewRendererOptions {
  /**
   * This function is called when the node view is updated.
   * It allows you to compare the old node with the new node and decide if the component should update.
   */
  update:
    | ((props: {
        oldNode: ProseMirrorNode
        oldDecorations: readonly Decoration[]
        oldInnerDecorations: DecorationSource
        newNode: ProseMirrorNode
        newDecorations: readonly Decoration[]
        innerDecorations: DecorationSource
        updateProps: () => void
      }) => boolean)
    | null
  /**
   * The tag name of the element wrapping the React component.
   */
  as?: string
  /**
   * The class name of the element wrapping the React component.
   */
  className?: string
  /**
   * Attributes that should be applied to the element wrapping the React component.
   * If this is a function, it will be called each time the node view is updated.
   * If this is an object, it will be applied once when the node view is mounted.
   */
  attrs?:
    | Record<string, string>
    | ((props: { node: ProseMirrorNode; HTMLAttributes: Record<string, any> }) => Record<string, string>)
}

export const createReactNodeView = <T = HTMLElement>(
  component: ComponentType<ReactNodeViewProps<T>>,
  props: ReactNodeViewProps,
  options?: Partial<ReactNodeViewRendererOptions>,
): NodeView<ComponentType<ReactNodeViewProps<T>>, Editor, ReactNodeViewRendererOptions> => {
  const editor = props.editor
  const extension = props.extension
  const node = props.node
  const decorations = props.decorations
  const innerDecorations = props.innerDecorations
  const view = props.view
  const HTMLAttributes = props.HTMLAttributes
  const getPos = props.getPos

  /**
   * The renderer instance.
   */
  let renderer!: ReactRenderer<unknown, ReactNodeViewProps<T>>

  /**
   * The element that holds the rich-text content of the node.
   */
  let contentDOMElement: HTMLElement | null

  // --- NodeView<> Methods ---

  const updateAttributes:NodeView<Component, NodeEditor, Options>['updateAttributes'] = (attributes: Record<string, any>) => {
    editor.commands.command(({ tr }) => {
      const pos = getPos()

      if (typeof pos !== 'number') {
        return false
      }

      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        ...attributes,
      })

      return true
    })
  }

  const deleteNode = (): void => {
    const from = getPos()

    if (typeof from !== 'number') {
      return
    }
    const to = from + node.nodeSize

    editor.commands.deleteRange({ from, to })
  }

  // --- ReactNodeView<> Internal Methods ---
  
  /**
   * Select the node.
   * Add the `selected` prop and the `ProseMirror-selectednode` class.
   */
  const selectNode = () => {
    renderer.updateProps({ selected: true })
    renderer.element.classList.add('ProseMirror-selectednode')
  }

  /**
   * Deselect the node.
   * Remove the `selected` prop and the `ProseMirror-selectednode` class.
   */
  const deselectNode = () => {
    renderer.updateProps({ selected: false })
    renderer.element.classList.remove('ProseMirror-selectednode')
  }

  /**
   * Handles editor selection updates to apply/remove the 'selected' state.
   */
  const handleSelectionUpdate = () => {
    const { from, to } = editor.state.selection
    const pos = getPos()

    if (typeof pos !== 'number') {
      return
    }

    // Check if the node is selected
    if (from <= pos && to >= pos + node.nodeSize) {
      if (!renderer.props.selected) {
        selectNode()
      }
    } else if(renderer.props.selected) {
      deselectNode()
    }
  }

  /**
   * Updates the attributes of the top-level DOM element.
   */
  const updateElementAttributes = () => {
    if (!options.attrs) {
      return
    }

    let attrsObj: Record<string, string> = {}
    if (typeof options.attrs === 'function') {
      const extensionAttributes = editor.extensionManager.attributes
      const renderedAttributes = getRenderedAttributes(node, extensionAttributes)
      attrsObj = options.attrs({ node, HTMLAttributes: renderedAttributes })
    } else {
      attrsObj = options.attrs
    }

    renderer.updateAttributes(attrsObj)
  }

  // --- Initialization (replaces the `mount` method) ---
  props = {
    ...props,
    updateAttributes: (attrs = {}) => updateAttributes(attrs),
    deleteNode,
    ref: createRef<T>(),
  } satisfies ReactNodeViewProps<T>

  if (!(Component as any).displayName) {
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.substring(1)
    ;(Component as any).displayName = capitalize(extension.name)
  }

  // The 'nodeViewContentRef' is a callback to append the contentDOM.
  // useRef() a no for RSCs...
  /*
  const nodeViewContentRef: ReactNodeViewContextProps['nodeViewContentRef'] = element => {
    if (element && contentDOMElement && element.firstChild !== contentDOMElement) {
      element.appendChild(contentDOMElement)
    }
  } */

  // IMPORTANT: The original class used `this.onDragStart`. This method is inherited
  // from the `NodeView` base class. Without extending that class, we lose this method.
  // If drag-and-drop functionality is required, you will need to implement it manually
  // or find an alternative way to access the base functionality.
  // const onDragStart = (event: DragEvent) => {
    // onDragStart logic would go here.
  // }

  // const context = { onDragStart, nodeViewContentRef }

  // Memoize the provider for performance, just like in the original class.
  const ReactNodeViewProvider: NamedExoticComponent<ReactNodeViewProps<T>> = memo(componentProps => (
    //<ReactNodeViewContext.Provider value={context}>
      {createElement(Component, componentProps)}
    // </ReactNodeViewContext.Provider>
  ))

  ReactNodeViewProvider.displayName = 'ReactNodeView'

  if (node.isLeaf) {
    contentDOMElement = null
  } else {
    const tag = options.contentDOMElementTag || (node.isInline ? 'span' : 'div')
    contentDOMElement = document.createElement(tag)
    contentDOMElement.dataset.nodeViewContent = ''
    contentDOMElement.style.whiteSpace = 'inherit'
  }

  const as = options.as || (node.isInline ? 'span' : 'div')
  const className = `node-${node.type.name} ${options.className || ''}`.trim()

  renderer = new ReactRenderer(ReactNodeViewProvider, {
    editor,
    props,
    as,
    className,
  })

  editor.on('selectionUpdate', handleSelectionUpdate)
  updateElementAttributes()


  // --- The returned NodeView object ---
  return {
    get dom(): HTMLElement {
      if (
        renderer.element.firstElementChild
        && !renderer.element.firstElementChild?.hasAttribute('data-node-view-wrapper')
      ) {
        throw new Error('Please use the NodeViewWrapper component for your node view.')
      }
      return renderer.element as HTMLElement
    },

    get contentDOM(): HTMLElement | null {
      return contentDOMElement
    },

    update(newNode, newDecorations, newInnerDecorations): boolean {
      const rerenderComponent = (newComponentProps?: Record<string, any>) => {
        renderer.updateProps(newComponentProps)
        updateElementAttributes()
      }

      if (newNode.type !== node.type) {
        return false
      }

      if (typeof options.update === 'function') {
        const result = options.update({
          oldNode: node,
          oldDecorations: decorations,
          oldInnerDecorations: innerDecorations,
          newNode,
          newDecorations,
          innerDecorations: newInnerDecorations,
          updateProps: () => rerenderComponent({ node: newNode, decorations: newDecorations, innerDecorations: newInnerDecorations }),
        })
        
        // Update internal state after callback
        node = newNode
        decorations = newDecorations
        innerDecorations = newInnerDecorations
        
        return result
      }
      
      if (newNode === node && decorations === newDecorations && innerDecorations === newInnerDecorations) {
        return true
      }

      // Update internal state
      node = newNode
      decorations = newDecorations
      innerDecorations = newInnerDecorations

      rerenderComponent({ node, decorations, innerDecorations })
      return true
    },

    destroy() {
      renderer.destroy()
      editor.off('selectionUpdate', handleSelectionUpdate)
      contentDOMElement = null
    },

    selectNode,
    deselectNode,
  }
}

/**
 * Create a React node view renderer.
 */
export function ReactNodeViewRenderer<T = HTMLElement>(
  component: ComponentType<ReactNodeViewProps<T>>,
  options?: Partial<ReactNodeViewRendererOptions>,
): NodeViewRenderer {
  return props => {
    // try to get the parent component
    // this is important for vue devtools to show the component hierarchy correctly
    // maybe it’s `undefined` because <editor-content> isn’t rendered yet
    if (!(props.editor as EditorWithContentComponent).contentComponent) {
      return {} as unknown as ProseMirrorNodeView
    }

    return createReactNodeView<T>(component, props, options)
  }
}

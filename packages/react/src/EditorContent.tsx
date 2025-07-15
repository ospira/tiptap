// 2

import type { Editor } from '@tiptap/core'
import type { ForwardedRef, HTMLProps, LegacyRef, MutableRefObject } from 'react'
// problem
import React, { forwardRef, useRef, useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'

import type { ContentComponent, EditorWithContentComponent } from './Editor.js'
import type { ReactRenderer } from './ReactRenderer.js'

const mergeRefs = <T extends HTMLDivElement>(...refs: Array<MutableRefObject<T> | LegacyRef<T> | undefined>) => {
  return (node: T) => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ;(ref as MutableRefObject<T | null>).current = node
      }
    })
  }
}

/**
 * This component renders all of the editor's node views.
 */
const Portals: React.FC<{ contentComponent: ContentComponent }> = ({ contentComponent }) => {
  // For performance reasons, we render the node view portals on state changes only
  const renderers = useSyncExternalStore(
    contentComponent.subscribe,
    contentComponent.getSnapshot,
    contentComponent.getServerSnapshot,
  )

  // This allows us to directly render the portals without any additional wrapper
  return <>{Object.values(renderers)}</>
}

export interface EditorContentProps extends HTMLProps<HTMLDivElement> {
  editor: Editor | null
  innerRef?: ForwardedRef<HTMLDivElement | null>
}

function getInstance(): ContentComponent {
  const subscribers = new Set<() => void>()
  let renderers: Record<string, React.ReactPortal> = {}

  return {
    /**
     * Subscribe to the editor instance's changes.
     */
    subscribe(callback: () => void) {
      subscribers.add(callback)
      return () => {
        subscribers.delete(callback)
      }
    },
    getSnapshot() {
      return renderers
    },
    getServerSnapshot() {
      return renderers
    },
    /**
     * Adds a new NodeView Renderer to the editor.
     */
    setRenderer(id: string, renderer: ReactRenderer) {
      renderers = {
        ...renderers,
        [id]: ReactDOM.createPortal(renderer.reactElement, renderer.element, id),
      }

      subscribers.forEach(subscriber => subscriber())
    },
    /**
     * Removes a NodeView Renderer from the editor.
     */
    removeRenderer(id: string) {
      const nextRenderers = { ...renderers }

      delete nextRenderers[id]
      renderers = nextRenderers
      subscribers.forEach(subscriber => subscriber())
    },
  }
}

export const PureEditorContent: React.FC<EditorContentProps> = props => {
  const { editor, innerRef, ...rest } = props

  const editorContentRef = useRef<HTMLDivElement>(null)

  // do i even need this ref?
  const initialized = useRef(false)

  const [hasContentComponentInitialized, setHasContentComponentInitialized] = useState(
    !!(editor as EditorWithContentComponent | null)?.contentComponent
  )

const unsubscribeRef = useRef<ReturnType<ContentComponent['subscribe']>>();
 
  
useEffect(() => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = undefined;
      }

      const editorWithContent = editor as EditorWithContentComponent | null

      if (editorWithContent && !editorWithContent.isDestroyed && editorWithContent.options.element) {
        if (editorWithContent.contentComponent) {
          return
        }

        const element = editorContentRef.current
        if (element) {
          element.append(...editorWithContent.options.element.childNodes)

          editorWithContent.setOptions({
            element,
          })
        }

        editorWithContent.contentComponent = getInstance()
        // Has the content component been initialized?
        if (!hasContentComponentInitialized) {
          // Subscribe to the content component
          unsubscribeRef.current = editorWithContent.contentComponent.subscribe(() => {
            setHasContentComponentInitialized(true)
          })
          // Set to unsubscribe to previous content component for use in useEffect cleanup
          
        }

        editorWithContent.createNodeViews()
        initialized.current = true
      }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = undefined;
      }

      const editorWithContent = editor as EditorWithContentComponent | null
      if (!editorWithContent) {
        return
      }

      initialized.current = false

      if (!editorWithContent.isDestroyed) {
        editorWithContent.view.setProps({
          // !!!... not this actually
          nodeViews: {},
        })
      }

      editorWithContent.contentComponent = null

      if (!editorWithContent.options.element?.firstChild) {
        return
      }

      const newElement = document.createElement('div')
      newElement.append(...editorWithContent.options.element.childNodes)

      editorWithContent.setOptions({
        element: newElement,
      })
    }
  }, [editor, hasContentComponentInitialized])


 return (
      <>
        <div ref={mergeRefs(innerRef, editorContentRef)} {...rest} />
        {/* @ts-ignore */}
        {editor?.contentComponent && <Portals contentComponent={editor.contentComponent} />}
      </>
    )
}

// EditorContent should be re-created whenever the Editor instance changes
const EditorContentWithKey = forwardRef<HTMLDivElement, EditorContentProps>(
  (props: Omit<EditorContentProps, 'innerRef'>, ref) => {
    const key = React.useMemo(() => {
      return Math.floor(Math.random() * 0xffffffff).toString()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.editor])

    // Can't use JSX here because it conflicts with the type definition of Vue's JSX, so use createElement
    // debugger;
    return React.createElement(PureEditorContent, {
      key,
      innerRef: ref,
      ...props,
    })
  },
)

export const EditorContent = React.memo(EditorContentWithKey)

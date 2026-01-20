/**
 * Type augmentation for @react-spring/web
 *
 * Fixes type errors with animated components not accepting
 * className, children, and other common HTML attributes.
 */

import type { SpringValue, Interpolation } from '@react-spring/web'
import type { CSSProperties, ReactNode, ComponentType, ForwardRefExoticComponent } from 'react'

declare module '@react-spring/web' {
  // Animated style type with spring values
  type AnimatedStyle<T = CSSProperties> = {
    [P in keyof T]?: T[P] | SpringValue<T[P]> | Interpolation<any, T[P]>
  }

  // Props that animated components accept
  interface AnimatedComponentProps {
    className?: string
    children?: ReactNode
    style?: AnimatedStyle
    [key: string]: any
  }

  // Type for animated HTML elements
  type AnimatedComponent<T extends keyof JSX.IntrinsicElements> = ForwardRefExoticComponent<
    JSX.IntrinsicElements[T] & {
      style?: AnimatedStyle
    }
  >

  // Animated factory and namespace
  interface AnimatedFactory {
    // Factory function: animated('div')
    <T extends keyof JSX.IntrinsicElements>(element: T): AnimatedComponent<T>
    // Factory function for custom components
    <T extends ComponentType<any>>(component: T): ForwardRefExoticComponent<any>
  }

  // Extend animated with both factory function and element access
  interface AnimatedElements extends AnimatedFactory {
    div: AnimatedComponent<'div'>
    span: AnimatedComponent<'span'>
    p: AnimatedComponent<'p'>
    h1: AnimatedComponent<'h1'>
    h2: AnimatedComponent<'h2'>
    h3: AnimatedComponent<'h3'>
    h4: AnimatedComponent<'h4'>
    button: AnimatedComponent<'button'>
    img: AnimatedComponent<'img'>
    svg: AnimatedComponent<'svg'>
    path: ForwardRefExoticComponent<any>
    circle: ForwardRefExoticComponent<any>
    rect: ForwardRefExoticComponent<any>
    g: ForwardRefExoticComponent<any>
    [key: string]: any
  }

  export const animated: AnimatedElements
}

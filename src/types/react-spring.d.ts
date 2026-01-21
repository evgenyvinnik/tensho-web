/**
 * Type augmentation for @react-spring/web
 *
 * Fixes type errors with animated components not accepting
 * className, children, and other common HTML attributes.
 */

import type { SpringValue, Interpolation } from '@react-spring/web'
import type { CSSProperties, ReactNode, ComponentType, ForwardRefExoticComponent, SVGProps } from 'react'

declare module '@react-spring/web' {
  // Animated style type with spring values
  type AnimatedStyle<T = CSSProperties> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [P in keyof T]?: T[P] | SpringValue<T[P]> | Interpolation<any, T[P]>
  }

  // Props that animated components accept
  interface AnimatedComponentProps {
    className?: string
    children?: ReactNode
    style?: AnimatedStyle
    [key: string]: unknown
  }

  // Type for animated HTML elements
  type AnimatedComponent<T extends keyof JSX.IntrinsicElements> = ForwardRefExoticComponent<
    JSX.IntrinsicElements[T] & {
      style?: AnimatedStyle
    }
  >

  // SVG animated component type
  type AnimatedSVGComponent<T extends keyof JSX.IntrinsicElements> = ForwardRefExoticComponent<
    SVGProps<SVGElement> & JSX.IntrinsicElements[T] & {
      style?: AnimatedStyle
    }
  >

  // Animated factory and namespace
  interface AnimatedFactory {
    // Factory function: animated('div')
    <T extends keyof JSX.IntrinsicElements>(element: T): AnimatedComponent<T>
    // Factory function for custom components
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T extends ComponentType<any>>(component: T): ForwardRefExoticComponent<T extends ComponentType<infer P> ? P : Record<string, unknown>>
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
    path: AnimatedSVGComponent<'path'>
    circle: AnimatedSVGComponent<'circle'>
    rect: AnimatedSVGComponent<'rect'>
    g: AnimatedSVGComponent<'g'>
    [key: string]: AnimatedComponent<keyof JSX.IntrinsicElements> | ((...args: unknown[]) => unknown)
  }

  export const animated: AnimatedElements
}

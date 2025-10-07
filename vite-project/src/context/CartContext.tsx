"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import axiosInstance from "@/lib/axios"

interface Product {
  id: number
  title: string
  description: string
  price: number
  current_price: number
  product_type: 'course' | 'file' | 'test'
  image?: string
  file?: number
  course?: number
  test?: number
  has_active_discount: boolean
  created_at: string
}

interface CartItem {
  product: Product
  quantity: number
  price: number
  total: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: Product, quantity?: number) => Promise<void>
  removeFromCart: (productId: number) => Promise<void>
  updateQuantity: (productId: number, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  removePurchasedItems: (purchasedProductIds: number[]) => Promise<void>
  getCartTotal: () => number
  getCartCount: () => number
  refreshCart: () => Promise<void>
  restorePendingCart: () => Promise<void>
  loading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  // Load cart from backend on mount
  useEffect(() => {
    refreshCart()
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const refreshCart = async () => {
    try {
      setLoading(true)
      
      // Try new cart endpoint first
      try {
        const response = await axiosInstance.get('/shop/cart/')
        if (response.data.items) {
          setCart(response.data.items)
          return
        }
      } catch (error) {
        const errorResponse = error as { response?: { status?: number } }
        if (errorResponse.response?.status !== 404) {
          throw error
        }
        // If 404, fall through to localStorage fallback
      }
      
      // Fallback to localStorage if backend endpoint not available
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          const localCart = JSON.parse(savedCart)
          // Convert localStorage format to backend format
          setCart(localCart.map((item: {product: Product, quantity: number}) => ({
            product: item.product,
            quantity: item.quantity,
            price: item.product.current_price,
            total: item.product.current_price * item.quantity
          })))
        } catch (parseError) {
          console.error('Error parsing localStorage cart:', parseError)
          localStorage.removeItem('cart')
        }
      }
    } catch (error) {
      console.error('Error loading cart from backend:', error)
      // Already handled localStorage fallback above
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (product: Product, quantity: number = 1) => {
    try {
      setLoading(true)
      
      // Try new backend endpoint first
      try {
        const response = await axiosInstance.post('/shop/cart/manage/', {
          product_id: product.id,
          quantity: quantity
        })
        
        if (response.data) {
          // Refresh cart to get updated data
          await refreshCart()
          return
        }
      } catch (error) {
        const errorResponse = error as { response?: { status?: number } }
        if (errorResponse.response?.status !== 404) {
          throw error
        }
        // If 404, fall through to localStorage behavior
      }
      
      // Fallback to localStorage behavior
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.product.id === product.id)
        
        if (existingItem) {
          const updatedCart = prevCart.map(item =>
            item.product.id === product.id
              ? { 
                  ...item, 
                  quantity: item.quantity + quantity,
                  total: (item.quantity + quantity) * item.price
                }
              : item
          )
          // Update localStorage
          localStorage.setItem('cart', JSON.stringify(updatedCart.map(item => ({
            product: item.product,
            quantity: item.quantity
          }))))
          return updatedCart
        }
        
        const newCart = [...prevCart, { 
          product, 
          quantity, 
          price: product.current_price,
          total: product.current_price * quantity
        }]
        
        // Update localStorage
        localStorage.setItem('cart', JSON.stringify(newCart.map(item => ({
          product: item.product,
          quantity: item.quantity
        }))))
        
        return newCart
      })
    } catch (error) {
      console.error('Error adding to cart:', error)
      // Already handled fallback above
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (productId: number) => {
    try {
      setLoading(true)
      await axiosInstance.delete('/shop/cart/manage/', {
        data: { product_id: productId }
      })
      await refreshCart()
    } catch (error) {
      console.error('Error removing from cart:', error)
      // Fallback to localStorage behavior
      setCart(prevCart => prevCart.filter(item => item.product.id !== productId))
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId)
      return
    }
    
    try {
      setLoading(true)
      await axiosInstance.put('/shop/cart/manage/', {
        product_id: productId,
        quantity: quantity
      })
      await refreshCart()
    } catch (error) {
      console.error('Error updating quantity:', error)
      // Fallback to localStorage behavior
      setCart(prevCart =>
        prevCart.map(item =>
          item.product.id === productId 
            ? { 
                ...item, 
                quantity,
                total: quantity * item.price
              } 
            : item
        )
      )
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    try {
      setLoading(true)
      await axiosInstance.delete('/shop/cart/')
      setCart([])
      localStorage.removeItem('cart')
    } catch (error) {
      console.error('Error clearing cart:', error)
      // Fallback to localStorage behavior
      setCart([])
      localStorage.removeItem('cart')
    } finally {
      setLoading(false)
    }
  }

  const removePurchasedItems = async (purchasedProductIds: number[]) => {
    try {
      setLoading(true)
      
      // Remove each purchased item from cart
      for (const productId of purchasedProductIds) {
        try {
          await axiosInstance.delete(`/shop/cart/${productId}/`)
        } catch (error) {
          console.error(`Error removing product ${productId} from cart:`, error)
        }
      }
      
      // Update local cart state
      setCart(prevCart => prevCart.filter(item => !purchasedProductIds.includes(item.product.id)))
      
      // Update localStorage
      const updatedCart = cart.filter(item => !purchasedProductIds.includes(item.product.id))
      localStorage.setItem('cart', JSON.stringify(updatedCart))
      
    } catch (error) {
      console.error('Error removing purchased items from cart:', error)
      // Fallback to localStorage behavior
      const updatedCart = cart.filter(item => !purchasedProductIds.includes(item.product.id))
      setCart(updatedCart)
      localStorage.setItem('cart', JSON.stringify(updatedCart))
    } finally {
      setLoading(false)
    }
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.total, 0)
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const restorePendingCart = async () => {
    try {
      setLoading(true)
      const pendingCartData = localStorage.getItem('pending_purchase_cart')
      
      if (pendingCartData) {
        console.log('Restoring pending cart:', pendingCartData)
        const pendingItems = JSON.parse(pendingCartData)
        
        // Add each pending item to cart
        for (const item of pendingItems) {
          const product: Product = {
            id: item.product_id,
            title: item.product_title,
            description: '',
            price: item.product_price,
            current_price: item.product_price,
            product_type: 'course',
            has_active_discount: false,
            created_at: new Date().toISOString()
          }
          
          await addToCart(product, item.quantity)
        }
        
        // Clear pending cart data
        localStorage.removeItem('pending_purchase_cart')
        console.log('Pending cart restored and cleared')
      }
    } catch (error) {
      console.error('Error restoring pending cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    removePurchasedItems,
    getCartTotal,
    getCartCount,
    refreshCart,
    restorePendingCart,
    loading,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

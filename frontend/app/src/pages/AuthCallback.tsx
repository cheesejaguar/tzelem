import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          // Redirect to home with error
          navigate('/?error=auth_failed', { replace: true })
          return
        }

        if (data.session) {
          console.log('Auth successful:', data.session.user.email)
          // Redirect to intended destination or home
          const redirectTo = localStorage.getItem('auth_redirect') || '/'
          localStorage.removeItem('auth_redirect')
          navigate(redirectTo, { replace: true })
        } else {
          // No session found, redirect to home
          navigate('/', { replace: true })
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err)
        navigate('/?error=unexpected_error', { replace: true })
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
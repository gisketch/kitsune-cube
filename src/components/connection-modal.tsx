import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface ConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'success' | 'error'
  title: string
  message: string
  isMacRequired?: boolean
  onSubmitMac?: (mac: string) => void
}

export function ConnectionModal({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message,
  isMacRequired,
  onSubmitMac
}: ConnectionModalProps) {
  const [macAddress, setMacAddress] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    if (onSubmitMac && macAddress) {
      onSubmitMac(macAddress)
      setMacAddress('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg border bg-background p-6 shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className={`text-lg font-semibold leading-none tracking-tight ${type === 'error' ? 'text-destructive' : 'text-primary'}`}>
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {message}
            </p>
          </div>

          {isMacRequired && (
            <div className="flex flex-col gap-2">
              <label htmlFor="mac-address" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                MAC Address
              </label>
              <input
                id="mac-address"
                type="text"
                placeholder="E3:8C:8A:AB:0B:C9"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">
                Format: XX:XX:XX:XX:XX:XX
              </p>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {isMacRequired ? 'Cancel' : 'Close'}
            </Button>
            {isMacRequired && (
              <Button onClick={handleSubmit}>
                Submit
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

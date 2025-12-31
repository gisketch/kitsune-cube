import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import type { Solve } from '@/types'

export type { Solve }

const STORAGE_KEY = 'cube-solves'

function loadLocalSolves(): Solve[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load solves from localStorage:', e)
  }
  return []
}

function saveLocalSolves(solves: Solve[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(solves))
  } catch (e) {
    console.error('Failed to save solves to localStorage:', e)
  }
}

function calculateStats(solves: Solve[]) {
  const validSolves = solves.filter((s) => !s.dnf)
  if (validSolves.length === 0) {
    return { best: null, worst: null, average: null, ao5: null, ao12: null }
  }

  const times = validSolves.map((s) => (s.plusTwo ? s.time + 2000 : s.time))
  const sorted = [...times].sort((a, b) => a - b)

  const best = sorted[0]
  const worst = sorted[sorted.length - 1]
  const average = times.reduce((a, b) => a + b, 0) / times.length

  const calcAverage = (count: number) => {
    if (validSolves.length < count) return null
    const recent = times.slice(0, count)
    const sortedRecent = [...recent].sort((a, b) => a - b)
    const trimmed = sortedRecent.slice(1, -1)
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length
  }

  return {
    best,
    worst,
    average,
    ao5: calcAverage(5),
    ao12: calcAverage(12),
  }
}

export function useSolves() {
  const { user } = useAuth()
  const [solves, setSolves] = useState<Solve[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setSolves(loadLocalSolves())
      setLoading(false)
      return
    }

    const solvesRef = collection(db, 'users', user.uid, 'solves')
    const q = query(solvesRef, orderBy('date', 'desc'))
    let unsubscribed = false

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (unsubscribed) return
        const newSolves = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Solve[]
        setSolves(newSolves)
        setLoading(false)
      },
      (error) => {
        if (unsubscribed) return
        console.error('Failed to fetch solves from Firestore:', error)
        setSolves(loadLocalSolves())
        setLoading(false)
        unsubscribe()
      }
    )

    return () => {
      unsubscribed = true
      unsubscribe()
    }
  }, [user])

  useEffect(() => {
    if (!user && !loading) {
      saveLocalSolves(solves)
    }
  }, [solves, user, loading])

  const addSolve = useCallback(
    async (solve: Omit<Solve, 'id' | 'date'>) => {
      const newSolveData = {
        ...solve,
        date: new Date().toISOString(),
      }

      if (!user) {
        const newSolve: Solve = {
          ...newSolveData,
          id: crypto.randomUUID(),
        }
        setSolves((prev) => [newSolve, ...prev])
        return newSolve
      }

      try {
        const solvesRef = collection(db, 'users', user.uid, 'solves')
        const docRef = await addDoc(solvesRef, newSolveData)
        return { ...newSolveData, id: docRef.id } as Solve
      } catch (error) {
        console.error('Failed to add solve to Firestore:', error)
        return null
      }
    },
    [user]
  )

  const deleteSolve = useCallback(
    async (id: string) => {
      if (!user) {
        setSolves((prev) => prev.filter((s) => s.id !== id))
        return
      }

      try {
        await deleteDoc(doc(db, 'users', user.uid, 'solves', id))
      } catch (error) {
        console.error('Failed to delete solve from Firestore:', error)
      }
    },
    [user]
  )

  const updateSolve = useCallback(
    async (id: string, updates: Partial<Solve>) => {
      if (!user) {
        setSolves((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
        )
        return
      }

      try {
        await updateDoc(doc(db, 'users', user.uid, 'solves', id), updates)
      } catch (error) {
        console.error('Failed to update solve in Firestore:', error)
      }
    },
    [user]
  )

  const clearAll = useCallback(async () => {
    if (!user) {
      setSolves([])
      return
    }

    try {
      const batch = writeBatch(db)
      for (const solve of solves) {
        batch.delete(doc(db, 'users', user.uid, 'solves', solve.id))
      }
      await batch.commit()
    } catch (error) {
      console.error('Failed to clear solves from Firestore:', error)
    }
  }, [user, solves])

  const getStats = useCallback(() => calculateStats(solves), [solves])

  const migrateLocalToCloud = useCallback(async () => {
    if (!user) return { success: false, count: 0 }

    const localSolves = loadLocalSolves()
    if (localSolves.length === 0) return { success: true, count: 0 }

    try {
      const batch = writeBatch(db)
      const solvesRef = collection(db, 'users', user.uid, 'solves')

      for (const solve of localSolves) {
        const { id, ...solveData } = solve
        const newDocRef = doc(solvesRef)
        batch.set(newDocRef, solveData)
      }

      await batch.commit()
      localStorage.removeItem(STORAGE_KEY)
      return { success: true, count: localSolves.length }
    } catch (error) {
      console.error('Failed to migrate solves to cloud:', error)
      return { success: false, count: 0 }
    }
  }, [user])

  return {
    solves,
    loading,
    addSolve,
    deleteSolve,
    updateSolve,
    clearAll,
    getStats,
    migrateLocalToCloud,
    isCloudSync: !!user,
  }
}

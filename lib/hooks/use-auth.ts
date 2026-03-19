"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { auth, type MeResponse } from "@/lib/api"
import { useRouter } from "next/navigation"

export function useMe() {
  return useQuery<MeResponse, Error>({
    queryKey: ["me"],
    queryFn: auth.me,
    retry: false,
    staleTime: 60_000,
  })
}

export function useLogout() {
  const qc = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: auth.logout,
    onSuccess: () => {
      qc.clear()
      router.push("/login")
    },
  })
}
